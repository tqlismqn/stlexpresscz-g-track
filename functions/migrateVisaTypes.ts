import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const VISA_MAPPING = {
  "kartavenko oleksandr":"povoleni_k_pobytu","oliinykov yevhen":"povoleni_k_pobytu","bozhok ruslan":"vizum","meleshchuk dmytro":"povoleni_k_pobytu","mavrodiiev maksym":"povoleni_k_pobytu","curdov valentin":"povoleni_k_pobytu","rotari ion":"vizum","maximov dmitrii":"vizum","rotaru andrei":"povoleni_k_pobytu","solonitchii serghei":"vizum","klink valentin":"povoleni_k_pobytu","caraus iuri":"vizum","gromilo andrei":"povoleni_k_pobytu","zingan iurii":"vizum","gututui igor":"vizum","babiciuc victor":"povoleni_k_pobytu","dmitriev egor":"povoleni_k_pobytu","todorasco stanislav":"vizum","sadlovschi victor":"povoleni_k_pobytu","osadciuc evgheni":"vizum","cravcenco piotr":"povoleni_k_pobytu","stepanenco serghei":"vizum","cecoi artiom":"vizum","dzeman igor":"povoleni_k_pobytu","poleanin alexandr":"vizum","korzhov andrii":"povoleni_k_pobytu","lunin maxim":"povoleni_k_pobytu","sirbu sergiu":"povoleni_k_pobytu","serbul alexandru":"vizum","usturoi pavel":"povoleni_k_pobytu","vacarciuc victor":"vizum","medvedev andrei":"vizum","jucovschii serghei":"povoleni_k_pobytu","dobinda aurel":"povoleni_k_pobytu","berectari ivan":"povoleni_k_pobytu","bratan gheorghi":"vizum","maximov nicolai":"povoleni_k_pobytu","gancearuc alexei":"vizum","venglovscaia lilia":"povoleni_k_pobytu","burzacovschi alexandr":"vizum","covalevschii igor":"vizum","kusik oleksandr":"povoleni_k_pobytu","shelomentsev serhii":"vizum","chykhemskyi pavlo":"povoleni_k_pobytu","husaruk viacheslav":"povoleni_k_pobytu","pholadishvili teimuraz":"povoleni_k_pobytu","fedytsiv orest":"docasna_ochrana","vlashynets volodymyr":"vizum","tsikul andrii":"docasna_ochrana","bespechnyi serhii":"vizum","vovchenko oleksandr":"povoleni_k_pobytu","mazur volodymyr":"povoleni_k_pobytu","sanduliak yurii":"povoleni_k_pobytu","shneiders aliaksandr":"povoleni_k_pobytu","hurbych oleksandr":"povoleni_k_pobytu","piontkovskyi serhii":"povoleni_k_pobytu","mavrodiiev yevhen":"povoleni_k_pobytu","storchak mykola":"povoleni_k_pobytu","filipets ivan":"vizum","belocurenco oleg":"povoleni_k_pobytu","gumeni nicolae":"povoleni_k_pobytu","niculeac evgheni":"povoleni_k_pobytu","gusan eugeniu":"povoleni_k_pobytu","vasiliu vladimir":"povoleni_k_pobytu","vizgunov vladimir":"vizum","nedelea constantin":"povoleni_k_pobytu","sarahan serghei":"povoleni_k_pobytu","lavreniuk vitalii":"povoleni_k_pobytu","cucias serghei":"povoleni_k_pobytu","savenco oleg":"povoleni_k_pobytu","biekietov ihor":"povoleni_k_pobytu","galuscinschii ivan":"povoleni_k_pobytu","hromov victor":"vizum","koshel eduard":"vizum","matvieiev serhii":"vizum","brynush ivan":"povoleni_k_pobytu","hreziuk ruslan":"povoleni_k_pobytu","chepyshko vadym":"povoleni_k_pobytu","vilk serhii":"povoleni_k_pobytu","vilk yan":"povoleni_k_pobytu","khmara ruslan":"vizum","storozhyshyn pavlo":"vizum","golovin maxim":"povoleni_k_pobytu","onyshchuk bohdan":"vizum","morari serghei":"povoleni_k_pobytu","shepilov oleh":"povoleni_k_pobytu","tsyhura andrii":"vizum","halauko leanid":"povoleni_k_pobytu","cojocari vladimir":"vizum","crijanovschi alexandru":"povoleni_k_pobytu","savitchii alexandr":"povoleni_k_pobytu","tatarciuc ghenadie":"povoleni_k_pobytu","ucerajnei alexandr":"povoleni_k_pobytu","lotca sergiu":"vizum","stepura dmytro":"docasna_ochrana","zavtur serghei":"povoleni_k_pobytu","railean serghei":"povoleni_k_pobytu","rudenko vitalii":"povoleni_k_pobytu","diacenco serghei":"povoleni_k_pobytu","tapu veaceslav":"povoleni_k_pobytu","topor nicolae":"povoleni_k_pobytu","fachira andrei":"povoleni_k_pobytu","gherasimov nicolai":"povoleni_k_pobytu","poleacov alexandr":"povoleni_k_pobytu","bulgari dmitrii":"povoleni_k_pobytu","lisnic andrei":"povoleni_k_pobytu","serkis andrii":"docasna_ochrana","gutu andrei":"povoleni_k_pobytu","simionov vladislav":"povoleni_k_pobytu","vasiliev dmitri":"povoleni_k_pobytu","budanov sergei":"povoleni_k_pobytu","grudca oleg":"povoleni_k_pobytu","culcitchi veaceslav":"povoleni_k_pobytu","bratan mihail":"povoleni_k_pobytu","fachira boris":"povoleni_k_pobytu","gromadschi iuri":"povoleni_k_pobytu","iordachi valeri":"povoleni_k_pobytu","galusca ivan":"povoleni_k_pobytu","rjevschii vladimir":"povoleni_k_pobytu","borisenco oleg":"povoleni_k_pobytu","stefoglov valentin":"povoleni_k_pobytu","marushchenko ihor":"docasna_ochrana","vasiliu dmitrii":"povoleni_k_pobytu","mkrtchian serezha":"povoleni_k_pobytu","cechirlan maxim":"povoleni_k_pobytu","strelet vitalii":"vizum","cunetchii andrei":"povoleni_k_pobytu","sokolovskyi andrii":"docasna_ochrana","baraghin sergiu":"povoleni_k_pobytu","petis mihail":"vizum","kravchuk yuriy":"trvaly_pobyt","catan ion":"povoleni_k_pobytu","bivol lilian":"povoleni_k_pobytu","statii victor":"povoleni_k_pobytu","danici alexandr":"povoleni_k_pobytu","hacina andrei":"povoleni_k_pobytu","savciuc iurie":"povoleni_k_pobytu","chepiha oleksii":"vizum","kotula ihor":"povoleni_k_pobytu","rybchenko serhii":"povoleni_k_pobytu","naumenko oleh":"povoleni_k_pobytu","zaharevici ruslan":"vizum","lianka vitalii":"povoleni_k_pobytu","besleaga roman":"povoleni_k_pobytu","garcovenco igor":"povoleni_k_pobytu","sanduliak kostiantyn":"povoleni_k_pobytu","papchenko serhii":"povoleni_k_pobytu","voronetchii andrei":"vizum","kazimir iryna":"docasna_ochrana","murahovschii dmitrii":"vizum","chirilenco denis":"vizum","bazko nazar":"docasna_ochrana","bondarenko bohdan":"trvaly_pobyt","bondarenko yuliia":"trvaly_pobyt","colesnic timur":"povoleni_k_pobytu","crivenco iaroslav":"povoleni_k_pobytu","fedytsiv mariia":"docasna_ochrana","kovalchuk andriy":"povoleni_k_pobytu","krainiuk valentin":"povoleni_k_pobytu","kuzmenko yuliia":"docasna_ochrana","kylymnyk viktor":"docasna_ochrana","makushynskyi oleh":"docasna_ochrana","nasyrov ilnur":"docasna_ochrana","prylypko ruslan":"vizum_strpeni","sadovnyk stanislav":"docasna_ochrana","samoilov evgheni":"povoleni_k_pobytu","shcherbakov yevhenii":"docasna_ochrana","tsonyev volodymyr":"vizum","tsyhankov serhii":"povoleni_k_pobytu"
};

function reverseNameParts(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return parts.slice(1).join(' ') + ' ' + parts[0];
}

function lookupVisaType(driverName) {
  if (!driverName) return null;
  const normalized = driverName.trim().toLowerCase();
  if (VISA_MAPPING[normalized]) return VISA_MAPPING[normalized];
  const reversed = reverseNameParts(normalized);
  if (VISA_MAPPING[reversed]) return VISA_MAPPING[reversed];
  return null;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const drivers = await base44.asServiceRole.entities.Driver.list();

  let matched = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails = [];

  for (const driver of drivers) {
    const visaType = lookupVisaType(driver.name);
    if (!visaType) {
      skipped++;
      continue;
    }
    try {
      await base44.asServiceRole.entities.Driver.update(driver.id, { visa_type: visaType });
      console.log(`✓ ${driver.name} → ${visaType}`);
      matched++;
    } catch (err) {
      console.error(`✗ ${driver.name}: ${err.message}`);
      errors++;
      errorDetails.push({ name: driver.name, error: err.message });
    }
  }

  const summary = { total: drivers.length, matched, skipped, errors, errorDetails };
  console.log('Migration summary:', JSON.stringify(summary));
  return Response.json(summary);
});