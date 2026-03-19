import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const CH_DRIVERS = [
  "Babiciuc Victor", "Bazko Nazar", "Berectari Ivan", "Besleaga Roman", "Bivol Lilian",
  "Borisenco Oleg", "Bozhok Ruslan", "Bratan Gheorghi", "Bratan Mihail", "Brynush Ivan",
  "Budanov Sergei", "Bulgari Dmitrii", "Burzacovschi Alexandr", "Caraus Iuri", "Catan Ion",
  "Cechirlan Maxim", "Cecoi Artiom", "Chepiha Oleksii", "Chepyshko Vadym", "Chirilenco Denis",
  "Cojocari Vladimir", "Colesnic Timur", "Covalevschii Igor", "Cravcenco Piotr", "Cucias Serghei",
  "Culcitchi Veaceslav", "Cunetchii Andrei", "Curdov Valentin", "Danici Alexandr", "Diacenco Serghei",
  "Dmitriev Egor", "Dobinda Aurel", "Fachira Andrei", "Fedytsiv Mariia", "Filipets Ivan",
  "Gancearuc Alexei", "Gherasimov Nicolai", "Golovin Maxim", "Gromadschi Iuri", "Grudca Oleg",
  "Gumeni Nicolae", "Gusan Eugeniu", "Gutu Andrei", "Gututui Igor", "Hacina Andrei",
  "Halauko Leanid", "Hreziuk Ruslan", "Hromov Victor", "Hurbych Oleksandr", "Husaruk Viacheslav",
  "Iordachi Valeri", "Kartavenko Oleksandr", "Khmara Ruslan", "Korzhov Andrii", "Koshel Eduard",
  "Kotula Ihor", "Kovalchuk Andriy", "Krainiuk Valentin", "Kravchuk Yuriy", "Kusik Oleksandr",
  "Kuzmenko Yuliia", "Lavreniuk Vitalii", "Lianka Vitalii", "Lisnic Andrei", "Lotca Sergiu",
  "Matvieiev Serhii", "Mavrodiiev Maksym", "Mavrodiiev Yevhen", "Maximov Dmitrii", "Maximov Nicolai",
  "Mazur Volodymyr", "Medvedev Andrei", "Meleshchuk Dmytro", "Morari Serghei", "Murahovschii Dmitrii",
  "Nedelea Constantin", "Niculeac Evgheni", "Onyshchuk Bohdan", "Osadciuc Evgheni", "Papchenko Serhii",
  "Petis Mihail", "Piontkovskyi Serhii", "Poleacov Alexandr", "Railean Serghei", "Rjevschii Vladimir",
  "Rotari Ion", "Rotaru Andrei", "Rudenko Vitalii", "Rybchenko Serhii", "Sadlovschi Victor",
  "Sadovnyk Stanislav", "Samoilov Evgheni", "Sanduliak Kostiantyn", "Sanduliak Yurii", "Sarahan Serghei",
  "Savciuc Iurie", "Savenco Oleg", "Savitchii Alexandr", "Serbul Alexandru", "Serkis Andrii",
  "Shcherbakov Yevhenii", "Shelomentsev Serhii", "Shepilov Oleh", "Shneiders Aliaksandr", "Sirbu Sergiu",
  "Solonitchii Serghei", "Statii Victor", "Stefoglov Valentin", "Stepanenco Serghei", "Storozhyshyn Pavlo",
  "Tapu Veaceslav", "Tatarciuc Ghenadie", "Todorasco Stanislav", "Topor Nicolae", "Tsikul Andrii",
  "Tsonyev Volodymyr", "Tsyhankov Serhii", "Tsyhura Andrii", "Ucerajnei Alexandr", "Usturoi Pavel",
  "Vacarciuc Victor", "Vasiliev Dmitri", "Venglovscaia Lilia", "Vilk Serhii", "Vilk Yan",
  "Vizgunov Vladimir", "Vlashynets Volodymyr", "Voronetchii Andrei", "Vovchenko Oleksandr",
  "Zaharevici Ruslan", "Zavtur Serghei", "Zingan Iurii"
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // Fetch all drivers and all a1_certificate documents
  const [allDrivers, allA1Docs] = await Promise.all([
    base44.asServiceRole.entities.Driver.list(),
    base44.asServiceRole.entities.DriverDocument.filter({ document_type: 'a1_certificate' }),
  ]);

  // Build lookup: normalized name -> [driver, ...]  (handles duplicates like Tapu Veaceslav)
  const driversByName = new Map();
  for (const driver of allDrivers) {
    const key = (driver.name || '').trim().toLowerCase();
    if (!driversByName.has(key)) driversByName.set(key, []);
    driversByName.get(key).push(driver);
  }

  // Build lookup: driver_id -> [a1 docs sorted by expiry_date desc]
  const a1DocsByDriver = new Map();
  for (const doc of allA1Docs) {
    if (!a1DocsByDriver.has(doc.driver_id)) a1DocsByDriver.set(doc.driver_id, []);
    a1DocsByDriver.get(doc.driver_id).push(doc);
  }
  // Sort each driver's a1 docs: latest expiry first
  a1DocsByDriver.forEach((docs) => {
    docs.sort((a, b) => (b.expiry_date || '') > (a.expiry_date || '') ? 1 : -1);
  });

  const results = {
    total_in_list: CH_DRIVERS.length,
    matched_drivers: 0,
    updated_documents: 0,
    no_driver_found: [],
    no_a1_doc: [],
    updated: [],
  };

  for (const name of CH_DRIVERS) {
    const key = name.trim().toLowerCase();
    const matched = driversByName.get(key);

    if (!matched || matched.length === 0) {
      results.no_driver_found.push(name);
      continue;
    }

    // Handle duplicates: update all matched drivers (e.g. Tapu Veaceslav x2)
    for (const driver of matched) {
      results.matched_drivers++;
      const docs = a1DocsByDriver.get(driver.id);
      if (!docs || docs.length === 0) {
        results.no_a1_doc.push(`${name} (id: ${driver.id})`);
        continue;
      }

      const currentDoc = docs[0]; // latest by expiry_date
      await base44.asServiceRole.entities.DriverDocument.update(currentDoc.id, { a1_switzerland: true });
      results.updated_documents++;
      results.updated.push(`${name} (driver: ${driver.id}, doc: ${currentDoc.id})`);
    }
  }

  console.log('=== A1 Switzerland Migration Results ===');
  console.log(`Total in CH list: ${results.total_in_list}`);
  console.log(`Drivers matched: ${results.matched_drivers}`);
  console.log(`Documents updated: ${results.updated_documents}`);
  console.log(`Not found (${results.no_driver_found.length}):`, results.no_driver_found);
  console.log(`No A1 doc (${results.no_a1_doc.length}):`, results.no_a1_doc);

  return Response.json(results);
});