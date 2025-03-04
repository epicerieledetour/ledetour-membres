// CHANGELOG
// - 3 Mar 2025 - remove fields public_fields, members_public_fields and contains_private_data
//                now generated client side
// - 7 Aug 2021 - indi and fam hours are now taken from "VRAI" columns AD and AE.
// - 15 Nov 2019 - json now includes hours for all family members.

// Get Member List Url from library DetourTableauUrl
// Library code: https://script.google.com/u/1/home/projects/1rLXj5KqFRmp91KFSI4wwViFda6-0vG4_QqYGAgWmk_ApYpAtnUv-4Hzr/edit
const MEMBER_LIST_URL = DetourTableauUrl.loadUrlListeMembres();

function doGet(e) {

  const SHEET_NAME ="liste des membres"
  sheet = SpreadsheetApp.openByUrl(MEMBER_LIST_URL).getSheetByName(SHEET_NAME);

  // get range of dimensions in which data is present.
  var dataRange = sheet.getDataRange();

  // Logger.log("Last column: " + dataRange.getLastColumn());
  // Logger.log("Last row: " + dataRange.getLastRow());

  // Store the entire table in a multi-dimenssional array
  var dataArray = dataRange.getValues();
  dataArray.shift();  // remove table headers

  var filteredObject = makeTableObject(dataArray);
  var result = JSON.stringify(filteredObject);
  // Logger.log(result);

  return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
}

function makeTableObject(multiArray){

  const STATUS_COL = 0;
  const FAMILYNAME_COL = 5;
  const FIRSTNAME_COL = 6;
  const PHONE_COL = 9;
  const FAM_COL = 2;
  const MEMBER_COL = 3;
  const INDI_HRS_COL = 21;
  const FAM_HRS_COL = INDI_HRS_COL + 1;
  const VRAI_INDI_HRS_COL = 29;               // col AD
  const VRAI_FAM_HRS_COL = VRAI_INDI_HRS_COL + 1;  // col AE

  var tableObject = {};
  tableObject.updated_at = new Date();
  tableObject.cycle_end = getCycleEndDate();
  tableObject.members = {};
  tableObject.source = MEMBER_LIST_URL;

  multiArray.forEach(function(row, i){

      var status = (row[STATUS_COL] == "Actif");
      var member = row[MEMBER_COL];
      var family = row[FAM_COL];
      var hours;

    // Logger.log("MultiArray row: " + i + " , Member: " + row[MEMBER_COL]);   // Debug only


    // If family, return the hours for the chef de famille, otherwise return the individual member hours.
    if(isFamily(member, family)){
        hours = ( member == family ? row[VRAI_FAM_HRS_COL] : getChefHours(multiArray, family, VRAI_FAM_HRS_COL) );
      }else{
        hours = row[VRAI_INDI_HRS_COL];
      }

    tableObject.members[row[MEMBER_COL]] = {
        active: status,
        hours_in_bank: hours,
        family_name: row[FAMILYNAME_COL],
        first_name: row[FIRSTNAME_COL],
        phone: row[PHONE_COL]
      };
  });
  return tableObject;
}

function isFamily(member, family){
  if (family == ''){ // empty string
    return false
  } else if (typeof family == "number"){
    return true
  }
}
function getChefHours(array, family, VRAI_FAM_HRS_COL){
  var hours = array[family-2][VRAI_FAM_HRS_COL];  // -2 is for matching member number to array index (eg. member 2 is at index 0).
  return hours;
}

function getCycleEndDate(){
  const SHEET_STATS = 'Stats'
  const DATE_CELL_A1 = "B4"

  const statsSheet = SpreadsheetApp.openByUrl(MEMBER_LIST_URL).getSheetByName(SHEET_STATS)
  const cell = statsSheet.getRange(DATE_CELL_A1)
  // Logger.log(JSON.stringify(cell.getValue()))

  return cell.getValue()
}



