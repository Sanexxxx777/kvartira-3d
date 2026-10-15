// Offline planning allowances for Russian retail in 2026, RUB/m².
// Chinese locales retain the upstream CNY table; this is not an FX conversion.
const FLOOR_RUB = {wood:4500,walnut:6500,tile800:2400,tile600:1800,marble:9500,antislip:1600,terrazzo:3200,carpet:1500};
const floorRubles = () => LANG === 'ru' || LANG === 'en';
const floorPrice = id => floorRubles() ? FLOOR_RUB[id] : MATS[id].price;
const floorMoney = value => floorRubles() ? Math.round(value).toLocaleString(LANG === 'ru' ? 'ru-RU' : 'en-US')+' ₽' : '¥'+Math.round(value).toLocaleString('zh-CN');
const floorNote = () => floorRubles()
  ? tr('','Approximate 2026 prices, ₽/m². Materials + 5% waste; labour, delivery and underlay excluded. Not a shop quotation.')
  : tr('原项目示例价格，单位人民币，非本地报价。','Illustrative upstream prices in CNY; not a local quotation.');
