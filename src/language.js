function ruText(s){
  if (RU[s] !== undefined) return RU[s];
  for (const [pattern,tokens] of RU_PATTERNS){ const m = pattern.exec(s); if (m) return tokens.map(t => typeof t === 'number' ? m[t] : t).join(''); }
  return s;
}
const tr = (zh,en) => LANG === 'ru' ? ruText(en) : LANG === 'en' ? en : LANG === 'zht' ? s2t(zh) : zh;
const DEMO_EN = {'Прихожая':'Hallway','Комната':'Room','Спальня':'Bedroom','Гостиная':'Living Room','Кухня':'Kitchen','Ванная':'Bathroom','Туалет':'Toilet','Кладовая':'Storage Room'};
const EXTRA_ZH = {'Прихожая':'过道','Комната':'卧室','Спальня':'主卧室','Гостиная':'客厅','Кухня':'厨房','Ванная':'卫浴','Туалет':'卫生间','Кладовая':'储藏室','Storage & utility':'收纳与设备','Long hanging rail':'长衣挂杆','Double hanging rail':'双层挂杆','Open shelves':'开放搁架','Drawer unit':'抽屉柜','Overhead cabinet':'顶柜','Coat hooks':'衣钩','Boiler':'锅炉','Washer + dryer':'洗烘叠放','Tall cabinet':'高柜','Electrical panel':'配电箱','Decor':'装饰','Curtains':'窗帘','Wall art':'装饰画','Mirror':'镜子','Glass blocks':'玻璃砖'};

Object.assign(EXTRA_ZH, {'Floating cabinet':'悬空柜','Dresser on legs':'细腿斗柜','Oak desk':'橡木书桌','Podium / block':'地台 / 块体','Shelved niche':'搁架壁龛','Heated towel rail':'毛巾加热架','Ceiling rain shower':'顶喷花洒','Round stacking cabinet':'圆形组合柜'});
