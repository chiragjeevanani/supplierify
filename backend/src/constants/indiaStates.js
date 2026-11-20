/** GST state codes (first two digits of a GSTIN). */
export const STATE_CODES = {
  'jammu and kashmir': '01', 'himachal pradesh': '02', punjab: '03', chandigarh: '04', uttarakhand: '05', haryana: '06',
  delhi: '07', 'new delhi': '07', rajasthan: '08', 'uttar pradesh': '09', bihar: '10', sikkim: '11', 'arunachal pradesh': '12',
  nagaland: '13', manipur: '14', mizoram: '15', tripura: '16', meghalaya: '17', assam: '18', 'west bengal': '19', jharkhand: '20',
  odisha: '21', orissa: '21', chhattisgarh: '22', 'madhya pradesh': '23', gujarat: '24', 'dadra and nagar haveli and daman and diu': '26',
  daman: '26', maharashtra: '27', karnataka: '29', goa: '30', lakshadweep: '31', kerala: '32', 'tamil nadu': '33', puducherry: '34',
  pondicherry: '34', 'andaman and nicobar islands': '35', telangana: '36', 'andhra pradesh': '37', ladakh: '38'
};

export const SELLER_STATE_CODE = '27'; // Maharashtra

/** State code for a state name ("Maharashtra" -> "27"), or '' when unknown. */
export const stateCodeOf = (name) => STATE_CODES[String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')] || '';

export default { STATE_CODES, SELLER_STATE_CODE, stateCodeOf };
