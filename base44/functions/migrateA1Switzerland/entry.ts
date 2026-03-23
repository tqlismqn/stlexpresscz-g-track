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

  const body = await req.json().catch(() => ({}));
  const mode = body.mode || 'lookup'; // 'lookup' or 'update'
  const sr = base44.asServiceRole;

  if (mode === 'lookup') {
    // Phase 1: fetch drivers + a1 docs in parallel, resolve doc IDs to update
    const [allDrivers, allA1Docs] = await Promise.all([
      sr.entities.Driver.list('name', 500),
      sr.entities.DriverDocument.filter({ document_type: 'a1_certificate' }, 'expiry_date', 500),
    ]);

    const driversByName = new Map();
    for (const driver of allDrivers) {
      const key = (driver.name || '').trim().toLowerCase();
      if (!driversByName.has(key)) driversByName.set(key, []);
      driversByName.get(key).push(driver);
    }

    const a1DocsByDriver = new Map();
    for (const doc of allA1Docs) {
      if (!a1DocsByDriver.has(doc.driver_id)) a1DocsByDriver.set(doc.driver_id, []);
      a1DocsByDriver.get(doc.driver_id).push(doc);
    }
    a1DocsByDriver.forEach((docs) => {
      docs.sort((a, b) => (b.expiry_date || '') > (a.expiry_date || '') ? 1 : -1);
    });

    const docIdsToUpdate = [];
    const no_driver_found = [];
    const no_a1_doc = [];
    const matched = [];

    for (const name of CH_DRIVERS) {
      const key = name.trim().toLowerCase();
      const drivers = driversByName.get(key);
      if (!drivers || drivers.length === 0) { no_driver_found.push(name); continue; }
      for (const driver of drivers) {
        const docs = a1DocsByDriver.get(driver.id);
        if (!docs || docs.length === 0) { no_a1_doc.push(`${name} (${driver.id})`); continue; }
        docIdsToUpdate.push(docs[0].id);
        matched.push(`${name} → ${docs[0].id}`);
      }
    }

    console.log('=== LOOKUP PHASE ===');
    console.log(`Drivers in list: ${CH_DRIVERS.length}`);
    console.log(`Doc IDs to update: ${docIdsToUpdate.length}`);
    console.log(`Not found: ${no_driver_found.length}`, no_driver_found);
    console.log(`No A1 doc: ${no_a1_doc.length}`, no_a1_doc);

    return Response.json({ mode: 'lookup', docIdsToUpdate, matched, no_driver_found, no_a1_doc });
  }

  if (mode === 'update') {
    // Phase 2: receive doc IDs, update them all in parallel batches of 20
    const { docIds } = body;
    if (!Array.isArray(docIds) || docIds.length === 0) {
      return Response.json({ error: 'docIds array required' }, { status: 400 });
    }

    const BATCH = 20;
    let updated = 0;
    const errors = [];

    for (let i = 0; i < docIds.length; i += BATCH) {
      const batch = docIds.slice(i, i + BATCH);
      const batchResults = await Promise.allSettled(
        batch.map(id => sr.entities.DriverDocument.update(id, { a1_switzerland: true }))
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled') updated++;
        else errors.push(r.reason?.message || 'unknown error');
      }
    }

    console.log(`=== UPDATE PHASE === Updated: ${updated}/${docIds.length}, Errors: ${errors.length}`);
    if (errors.length) console.log('Errors:', errors);

    return Response.json({ mode: 'update', updated, total: docIds.length, errors });
  }

  return Response.json({ error: 'Unknown mode. Use mode: "lookup" or mode: "update"' }, { status: 400 });
});