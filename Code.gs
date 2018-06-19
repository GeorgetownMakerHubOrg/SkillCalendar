//georgetown.edu_rb1h0lgbkesf7re227b0q28d50@group.calendar.google.com


var MeritBadges = [
  'Laser Cutter',
  '3D Printing',	
  'Hand Tools',	
  'HandiBot',	
  'Power Tools',
  'Print Shop',	
  'Sewing Machine',
  'Embroidery Machine',	
  'Vinyl Cutter',
  'FormLabs',	
  'Soldering',
  'Arduino',
  'Button Maker',
  'Raspberry Pi'
];

var futuredays = 14; // how far in the future to look for creating new events


function getUserTable(){
  var userTable = SpreadsheetApp.openById(getUserTableId());
  return userTable;
}



function deleteSkillCalEvents(startTime, endTime){
  var realStartDate = new Date(startTime);
  var realEndDate = new Date(endTime);
  var skillCalendar = getSkillCal();
  
  try{
    var events = skillCalendar.getEvents(new Date(startTime), new Date(endTime));
    Logger.log(events.length);
    for(var i = events.length-1; i >= 0; i--){
      Logger.log("deleting");
      events[i].deleteEvent();
    }
  }catch(e){
    Logger.log(e); 
  }
}

function generateSkillEvents(startTime, endTime){

  
  // two weeks in ms: 1000 * 60 * 60 * 24 * 14
  var futuretime = 1000 * 60 * 60 * 24 * futuredays;

  if(!startTime){
    startTime = new Date();
//    startTime = "2018/06/01 01:00:00"; 
  }
  if(!endTime){
    var endTime = new Date(startTime.getTime() + futuretime);
  }
  Logger.log(startTime.toString());
  Logger.log(endTime.toString());
//  return;
  
  
  deleteSkillCalEvents(startTime.toString(), endTime.toString());
//  return;
  var skillCalendar = getSkillCal();

  var staffEvents = getStaffScheduleEvents(startTime.toString(), endTime.toString());
  
  for(var i=0;i<staffEvents.length; i++){
    staffEvent = staffEvents[i];
    
    var eventStart = staffEvent.startTime;
    var eventEnd   = staffEvent.endTime;
    
    Logger.log(JSON.stringify(staffEvent, null, ' '));
    if(staffEvent.guestList.length == 0){
      continue; 
    }
    staff = staffEvent.guestList[0].email;
    var netid = staff.split("@")[0];
    Logger.log(netid);
    
    var userData= getUserTableDataFromNetId(netid);
    
    Logger.log(JSON.stringify(userData, null, "  "));
    
    
    var badgeList = [];
    for(var j = 0; j < MeritBadges.length; j++){
      var badge = MeritBadges[j];
      if(userData[badge] && userData[badge].trim().toLowerCase() != "no"){
        badgeList.push(badge); 
      }
    }
    badgeList = badgeList.join(", ");
    Logger.log(badgeList);
    
    var title = badgeList;
    
    if(badgeList.trim() == ""){
      continue; 
    }
    createCalEvent(skillCalendar, eventStart, eventEnd, title, "", []);
    
  }
  
}




var userTableData = false;
var allUserData = false;

function getUserData(filter, sort){
  var userlist = {};
  var userTable = getUserTable();
  allUserData = userTable
  .getActiveSheet()
  .getDataRange()
  .getValues();
  
  /*
  Logger.log("all data");
  Logger.log(JSON.stringify(allUserData, null, "  "));
 */
  userTableData = dataIntoHashRows(allUserData, 0, 1); //, function(row){ return row['NetId'] == netId;}).data;  
  
  //Logger.log(userTableData);
  
  
  
  return JSON.parse(JSON.stringify(userTableData));
  
}


function getUserTableDataFromNetId(netId){

  if(!userTableData){
    getUserData(); 
  }

  var userData = dataIntoHashRows(allUserData, 0, 1, function(row){
    if(row["netid"].toString().toLowerCase().trim() == netId.toString().toLowerCase().trim()){
      return true;
    }
    return false;
  }); //, function(row){ return row['NetId'] == netId;}).data;
  
  if(userData.data.length > 0){
    return JSON.parse(JSON.stringify(userData.data[0]));
  }
  return false;
}


function getStaffScheduleEvents(startTime, endTime){
  
  if(!startTime){
    startTime = "2018/06/01 01:00:00"; 
  }
  if(!endTime){
    endTime = "2018/06/18 01:00:00";   
  }
  
  var cal = getStaffScheduleCal();
  var staffCalEvents = getCalEvents(cal, startTime, endTime); 

  return staffCalEvents;  
}



function createSkillCalEvent(startTime, endTime, title, description, guests){
  var cal = getSkillCal();
  return createCalEvent(cal, startTime, endTime, title, description, guests);
}



function getCalEvents(cal, startTime, endTime){
  var realStartDate = new Date(startTime);
  var realEndDate = new Date(endTime);
  try{
    var events = cal.getEvents(new Date(startTime), new Date(endTime));
    var returnEvents = events.map(function(event){
      var returnEvent = {
        id: event.getId(),
        calendarName : cal.getName(),
        startTime: event.getStartTime().toString(),
        endTime : event.getEndTime().toString(),
        title : event.getTitle(),
        description : event.getDescription(),
        guestList : event.getGuestList(true).map(function(guest){
          return {name : guest.getName(),
                  email : guest.getEmail(),
                  status: guest.getGuestStatus()
                 };
        }),
        creators : event.getCreators(),
        dateCreated : event.getDateCreated.toString(),
        location : event.getLocation()
      }
      return returnEvent;
    });
    return returnEvents;
  }catch (error){
    Logger.log(error);
    throw error; 
  }
}



/// Create Events
function createCalEvent(cal, startTime, endTime, title, description, guests){
   
  var guestlist = "";
  if(guests){
    var guestEmails = guests.map(function(g){
      if(g.indexOf("@") < 0){
        return g+"@georgetown.edu";
      }
    });
    guestlist = guestEmails.join(",");
  }
  
  var options = {
    location: "Maker Hub",
    description: description,
    guests : guestlist
  };
  
  var startDate = new Date(startTime);
  var endDate = new Date(endTime);  
  var event = cal.createEvent(title, new Date(startTime), new Date(endTime), options)

  var returnEvent = {
        id: event.getId(),
        startTime: event.getStartTime().toString(),
        endTime : event.getEndTime().toString(),
        title : event.getTitle(),
        description : event.getDescription(),
        guestList : event.getGuestList(true).map(function(guest){
          return {name : guest.getName(),
                  email : guest.getEmail(),
                  status: guest.getGuestStatus()
                 };
        }),
        creators : event.getCreators(),
        dateCreated : event.getDateCreated.toString(),
        location : event.getLocation()
      }
  return returnEvent;
}


/* 
=========================== DATAINTOHASHROWS ===============================
Any time you get some rows from a google sheet, run it through this function
so that it uses the column names as keys, instead of just numbers.
data : the data from the sheet
keysRow : the row that holds the column names (starts a 0, NOT 1)
startsRow : the row that holds the FIRST row of data (starts a 0, NOT 1)
filterFunction: a function that gets a row of data (with the column names as
keys), and returns true or false, based on whatever criteria you want.
============================================================================
*/
function dataIntoHashRows(data, keysRow, startRow, filterFunction){
  var idKey= {};
  var keyId= {};
  var newData = [];
//  Logger.log("data");
//  Logger.log(keysRow);
//  Logger.log(JSON.stringify(data, null, "  "));

  for (var k = 0; k < data[keysRow].length; k++) { 
    var key = data[keysRow][k];
    key = key.replace("?","");
    key = key.replace("'","");
    key = key.replace(":","");
    if(key.trim() == ""){
       continue;
    }
    
    idKey[k] = key;
    keyId[key] = k;
  }
    
  for (var i = startRow; i < data.length; i++) { 
    var newRow = {};
    for (var j = 0; j < data[i].length; j++) { 
      if(!idKey[j] || idKey[j].trim() == ""){
        continue; 
      }
      newRow[idKey[j]] = data[i][j];
    }
    if(!filterFunction || filterFunction(newRow) == true){
      newData.push(newRow);
    }
  }
  
  return {data:newData, keyId: keyId, idKey: idKey};
  
}



