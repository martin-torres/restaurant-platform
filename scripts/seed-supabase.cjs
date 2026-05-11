const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://auushbzgsjxyulkchwae.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1); }

const uuid = (s) => {
  const h = crypto.createHash('md5').update(s).digest('hex');
  return h.substring(0,8)+'-'+h.substring(8,12)+'-'+h.substring(12,16)+'-'+h.substring(16,20)+'-'+h.substring(20,32);
};

const R = {
  dip: uuid('r_dipasquale'),
  azu: uuid('r_azucarynuez'),
  buc: uuid('r_bucaneros'),
  sen: uuid('r_sencillito'),
  mau: uuid('r_maui')
};
const FP = { dip: uuid('fp_dipasquale'), buc: uuid('fp_bucaneros') };
const OWNER = uuid('owner_martin');

async function main() {
  // Staff (with passcode_hash for ALL entries)
  const { error: e1 } = await supabase.from('staff').insert([
    {restaurant_id:R.dip,name:'Marco Manager',pin:'1111',role:'manager',passcode_hash:'$2b$10$cWCth.ZXnpj/unSX7eRQ3OSGbRu0A6BLCL.urw0OCgC9lwsMWA2zy',is_active:true},
    {restaurant_id:R.dip,name:'Sofia Server',pin:'1112',role:'server',passcode_hash:'$2b$10$vBGhGhmua0pCxSFATGn6vOXLHWNOlq0zLtaMfziEInVcWOqlDiVea',is_active:true},
    {restaurant_id:R.dip,name:'Luigi Chef',pin:'1113',role:'kitchen',passcode_hash:'$2b$10$xKo2phGpUKKHX4oM/zUseenZCXbqlNnhrhqVbdplAn9P9nIl60HlG',is_active:true},
    {restaurant_id:R.dip,name:'Bartender',pin:'1114',role:'bar',passcode_hash:'$2b$10$AJViDJZO4y1Ik3Ne9U9MsOpA/Y8VoXxkhZu4hePboj5h3.DwNZqHu',is_active:true},
    {restaurant_id:R.buc,name:'Admin Bucanero',pin:'2221',role:'manager',passcode_hash:'$2b$10$dtKFkVidhFQdE9pXJTDG1.0KyRIn0le6d9pIFAMHLeq5yG8v1l9CS',is_active:true},
    {restaurant_id:R.buc,name:'Mesa Server',pin:'2222',role:'foh',passcode_hash:'$2b$10$rireUBOUsqYSl8T5EdNxK.ABVmscKKnoE5TwT8muyJbF1HnhgIjyu',is_active:true},
    {restaurant_id:R.buc,name:'Cocina Chef',pin:'2223',role:'kitchen',passcode_hash:'$2b$10$48rIlqzHlNN9KoOesX0yR.kFOjC2HqwxJ1kRcyUINGE4TjR27cSgS',is_active:true}
  ]);
  if (e1) { console.log('STAFF ERROR:', e1.message.substring(0,120)); return; }
  else console.log('Staff: 7 OK');

  // Tables DiPasquale
  const { error: e2 } = await supabase.from('restaurant_tables').insert([
    {restaurant_id:R.dip,floor_plan_id:FP.dip,display_name:'Mesa 1',table_number:1,seats:2,shape:'square',x:100,y:150,width:60,height:60},
    {restaurant_id:R.dip,floor_plan_id:FP.dip,display_name:'Mesa 2',table_number:2,seats:2,shape:'square',x:300,y:150,width:60,height:60},
    {restaurant_id:R.dip,floor_plan_id:FP.dip,display_name:'Mesa 3',table_number:3,seats:4,shape:'square',x:500,y:150,width:80,height:80},
    {restaurant_id:R.dip,floor_plan_id:FP.dip,display_name:'Mesa 4',table_number:4,seats:4,shape:'square',x:100,y:350,width:80,height:80},
    {restaurant_id:R.dip,floor_plan_id:FP.dip,display_name:'Mesa 5',table_number:5,seats:6,shape:'rectangle',x:300,y:320,width:120,height:80},
    {restaurant_id:R.dip,floor_plan_id:FP.dip,display_name:'Mesa 6',table_number:6,seats:4,shape:'circle',x:550,y:350,width:80,height:80}
  ]);
  if (e2) { console.log('TABLES DIP ERROR:', e2.message.substring(0,120)); return; }
  else console.log('Tables DiPasquale: 6 OK');

  // Tables Bucaneros
  const { error: e3 } = await supabase.from('restaurant_tables').insert([
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 1',table_number:1,seats:2,shape:'square',x:80,y:100,width:60,height:60},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 2',table_number:2,seats:2,shape:'square',x:220,y:100,width:60,height:60},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 3',table_number:3,seats:4,shape:'square',x:400,y:80,width:80,height:80},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 4',table_number:4,seats:4,shape:'square',x:600,y:80,width:80,height:80},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 5',table_number:5,seats:2,shape:'square',x:800,y:100,width:60,height:60},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 6',table_number:6,seats:6,shape:'rectangle',x:150,y:300,width:120,height:80},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 7',table_number:7,seats:4,shape:'square',x:400,y:300,width:80,height:80},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 8',table_number:8,seats:4,shape:'square',x:600,y:300,width:80,height:80},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 9',table_number:9,seats:6,shape:'rectangle',x:150,y:500,width:120,height:80},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 10',table_number:10,seats:4,shape:'square',x:400,y:500,width:80,height:80},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 11',table_number:11,seats:4,shape:'square',x:600,y:500,width:80,height:80},
    {restaurant_id:R.buc,floor_plan_id:FP.buc,display_name:'Mesa 12',table_number:12,seats:8,shape:'rectangle',x:800,y:350,width:160,height:100}
  ]);
  if (e3) { console.log('TABLES BUC ERROR:', e3.message.substring(0,120)); return; }
  else console.log('Tables Bucaneros: 12 OK');

  // Promos
  const { error: e4 } = await supabase.from('promos').insert([
    {restaurant_id:R.dip,name:'Pizza + Bebida',description:'Pizza individual + bebida por solo $179',discount_type:'fixed',discount_value:179,original_price:195,category:'Pizzas',active:true},
    {restaurant_id:R.buc,name:'Desayuno Completo',description:'Cafe + desayuno tradicional a elegir',discount_type:'fixed',discount_value:169,original_price:200,category:'Desayunos',active:true},
    {restaurant_id:R.sen,name:'Cafe + Postre',description:'Americano + postre artesanal',discount_type:'fixed',discount_value:79,original_price:97,category:'Cafe',active:true},
    {restaurant_id:R.mau,name:'2x1 en Mojitos',description:'Mojito clasico 2x1 todos los martes',discount_type:'percentage',discount_value:50,original_price:168,category:'Cocteleria',active:true},
    {restaurant_id:R.azu,name:'Cheesecake + Cafe',description:'Rebanada de cheesecake + cafe americano',discount_type:'fixed',discount_value:110,original_price:130,category:'Cheesecakes',active:true}
  ]);
  if (e4) { console.log('PROMOS ERROR:', e4.message.substring(0,120)); return; }
  else console.log('Promos: 5 OK');

  // QR codes
  const { error: e5 } = await supabase.from('restaurant_qr_codes').insert([
    {restaurant_id:R.dip,qr_type:'customer',qr_code_data:'http://localhost:5173/?restaurant_id=r_dipasquale'},
    {restaurant_id:R.dip,qr_type:'manager',qr_code_data:'http://localhost:5173/staff/login?restaurant_id=r_dipasquale'},
    {restaurant_id:R.buc,qr_type:'customer',qr_code_data:'http://localhost:5173/?restaurant_id=r_bucaneros'},
    {restaurant_id:R.buc,qr_type:'manager',qr_code_data:'http://localhost:5173/staff/login?restaurant_id=r_bucaneros'},
    {restaurant_id:R.sen,qr_type:'customer',qr_code_data:'http://localhost:5173/?restaurant_id=r_sencillito'},
    {restaurant_id:R.mau,qr_type:'customer',qr_code_data:'http://localhost:5173/?restaurant_id=r_maui'},
    {restaurant_id:R.azu,qr_type:'customer',qr_code_data:'http://localhost:5173/?restaurant_id=r_azucarynuez'}
  ]);
  if (e5) { console.log('QR ERROR:', e5.message.substring(0,120)); return; }
  else console.log('QR codes: 7 OK');

  // Platform owner
  const { error: e6 } = await supabase.from('platform_owner').insert([
    {id:OWNER,email:'dr.mtorres@icloud.com',name:'Martin Torres',passcode_hash:'$2b$10$s/KnzbVe0.timfJ6fgR/lOuG4Layc8jpNiab266.68BQNHPGPPDMy'}
  ]);
  if (e6) { console.log('OWNER ERROR:', e6.message.substring(0,120)); return; }
  else console.log('Platform owner: Martin Torres (1) OK');

  // Reviews
  const { error: e7 } = await supabase.from('visit_feedback').insert([
    {restaurant_id:R.dip,rating:5,comment:'La mejor lasagna de Monterrey, increible atencion'},
    {restaurant_id:R.dip,rating:4,comment:'Pizza muy buena, el lugar es acogedor'},
    {restaurant_id:R.dip,rating:5,comment:'Autentico sabor italiano, volveremos'},
    {restaurant_id:R.buc,rating:4,comment:'Los huevos bucaneros son deliciosos'},
    {restaurant_id:R.buc,rating:5,comment:'Excelente desayuno, el pulpo zarandeado espectacular'},
    {restaurant_id:R.sen,rating:5,comment:'El cafe de especialidad es increible, el ambiente super relajado'},
    {restaurant_id:R.sen,rating:4,comment:'Waffles deliciosos y el croissant de jamon serrano imperdible'},
    {restaurant_id:R.mau,rating:5,comment:'Las arepas peluas son como en Venezuela, 10/10'},
    {restaurant_id:R.mau,rating:4,comment:'Los mojitos y el ambiente, perfectos para una cena'},
    {restaurant_id:R.azu,rating:5,comment:'El cheesecake de manzana es el mejor postre de Monterrey'}
  ]);
  if (e7) { console.log('REVIEWS ERROR:', e7.message.substring(0,120)); return; }
  else console.log('Reviews: 10 OK');

  // VERIFICATION
  console.log('\n=== FINAL VERIFICATION ===');
  for (const t of ['restaurants','menu_items','staff','restaurant_tables','promos','restaurant_qr_codes','platform_owner','visit_feedback','floor_plans','restaurant_owners']) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(t + ': ' + count);
  }
}

main().catch(e => console.log('FATAL:', e.message));
