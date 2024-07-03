import { UAV_DESCRIPTION } from './const';

export const handleReqIdChange = (event) => {

  const allUavDescriptionKeys = Object.keys(UAV_DESCRIPTION);
  if(event.target.value){
    const res = event.target.value;
    if(allUavDescriptionKeys.includes(res)){
      let result = UAV_DESCRIPTION[res];
      result["selectedValue"] = res;
      return result;
    }
  }
  return {text : null, title : null, selectedValue : null};
};

export const getStatusStyle = (backendInfo) => {
  switch (backendInfo.backendStatus) {
    case 'idle':
      return { color: 'green' };
    case 'running':
      return { color: 'blue' };
    case 'error':
      return { color: 'red' };
    default:
      return { color: 'gray' };
  }
};