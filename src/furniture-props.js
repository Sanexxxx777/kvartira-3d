const FURNITURE_MM = Symbol('module furniture units');
function moduleFurnitureProps(f){
  // washdry recursively builds washer/dryer children from module props.
  // Their units are already mm, and only the enclosing group receives lift.
  if (f[FURNITURE_MM]) return {...f,lift:0};
  const props = {...f,[FURNITURE_MM]:true};
  for (const key of ['ht','y0','legs','nh','ny0','lift']) if (props[key] !== undefined) props[key] *= 1000;
  return props;
}
