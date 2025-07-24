// //pages/api/email/weekly-birthday-reminder
// import { queryDatabase } from "../../../lib/db";
// import { formatDate } from "utils/formatDate";

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     res.setHeader("Allow", ["POST"]);
//     return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
//   }

//   try {
//     // Employee data (same as your original)
//     const employees = [
//       {
//         code: "1001",
//         name: "Ramakrishnan Sundaram",
//         dob: "24-02-1973",
//         branch: "MUMBAI",
//         email: "Rama@densitypharmachem.com",
//       },
//       {
//         code: "1002",
//         name: "Satish H N",
//         dob: "02-11-1977",
//         branch: "HYDERABAD",
//         email: "satish@densitypharmachem.com",
//       },
//       {
//         code: "1003",
//         name: "Jothi Dinesh Kumar",
//         dob: "27-07-1976",
//         branch: "HYDERABAD",
//         email: "dinesh@densitypharmachem.com",
//       },
//       {
//         code: "1004",
//         name: "Raghu Bandari",
//         dob: "01-01-1982",
//         branch: "HYDERABAD",
//         email: "raghu@densitypharmachem.com",
//       },
//       {
//         code: "1005",
//         name: "Gurpreet Kaur Washist",
//         dob: "09-12-1991",
//         branch: "MUMBAI",
//         email: "gurpreet@densitypharmachem.com",
//       },
//       {
//         code: "1006",
//         name: "Bhavani Kulkarni",
//         dob: "30-05-1979",
//         branch: "HYDERABAD",
//         email: "bhavani@densitypharmachem.com",
//       },
//       {
//         code: "1007",
//         name: "Pratik Patil",
//         dob: "30-08-1987",
//         branch: "MUMBAI",
//         email: "pratik@densitypharmachem.com",
//       },
//       {
//         code: "1008",
//         name: "Mahesh Shegar",
//         dob: "07-05-1990",
//         branch: "MUMBAI",
//         email: "mahesh@densitypharmachem.com",
//       },
//       {
//         code: "1009",
//         name: "Saroj Kumar Purohit",
//         dob: "27-10-1984",
//         branch: "HYDERABAD",
//         email: "saroj@densitypharmachem.com",
//       },
//       {
//         code: "1010",
//         name: "JITENDAR KUMAR BISHOYI",
//         dob: "14-07-1988",
//         branch: "HYDERABAD",
//         email: "jitendar@densitypharmachem.com",
//       },
//       {
//         code: "1011",
//         name: "ARABINDA NANDA",
//         dob: "02-07-1983",
//         branch: "HYDERABAD",
//         email: "arabindia@densitypharmachem.com",
//       },
//       {
//         code: "1012",
//         name: "Christy Samuel",
//         dob: "29-10-1987",
//         branch: "MUMBAI",
//         email: "christy@densitypharmachem.com",
//       },
//       {
//         code: "1013",
//         name: "Vakkapati Durga Prasad",
//         dob: "15-04-1998",
//         branch: "HYDERABAD",
//         email: "durga@densitypharmachem.com",
//       },
//       {
//         code: "1014",
//         name: "Shafiqullah Khan",
//         dob: "18-05-1988",
//         branch: "MUMBAI",
//         email: "shafique@densitypharmachem.com",
//       },
//       {
//         code: "1015",
//         name: "Ravindra Patil",
//         dob: "05-04-1974",
//         branch: "MUMBAI",
//         email: "ravindra@densitypharmachem.com",
//       },
//       {
//         code: "1016",
//         name: "Kamalnain Kurra",
//         dob: "08-09-1972",
//         branch: "MUMBAI",
//         email: "kamal@densitypharmachem.com",
//       },
//       {
//         code: "1017",
//         name: "Jagadish Naidu",
//         dob: "22-08-1978",
//         branch: "MUMBAI",
//         email: "jagadish@densitypharmachem.com",
//       },
//       {
//         code: "1018",
//         name: "Maneesh Srivastava",
//         dob: "15-01-1981",
//         branch: "MUMBAI",
//         email: "maneesh@densitypharmachem.com",
//       },
//       {
//         code: "1019",
//         name: "Prashant Kadam",
//         dob: "01-01-1982",
//         branch: "MUMBAI",
//         email: "prashant@densitypharmachem.com",
//       },
//       {
//         code: "1020",
//         name: "Venkata Manikanth Akula",
//         dob: "21-08-1986",
//         branch: "HYDERABAD",
//         email: "manikanth@densitypharmachem.com",
//       },
//       {
//         code: "1021",
//         name: "Kalyan Babu",
//         dob: "09-08-1988",
//         branch: "HYDERABAD",
//         email: "kalyan@densitypharmachem.com",
//       },
//       {
//         code: "1022",
//         name: "Sukanya Pogaku",
//         dob: "23-10-1998",
//         branch: "HYDERABAD",
//         email: "sukanya@densitypharmachem.com",
//       },
//       {
//         code: "1023",
//         name: "Pratiksha Dabhane",
//         dob: "13-01-1993",
//         branch: "MUMBAI",
//         email: "pratiksha@densitypharmachem.com",
//       },
//       {
//         code: "1024",
//         name: "Navavnit Kumar",
//         dob: "01-07-1989",
//         branch: "HYDERABAD",
//         email: "navanit@densitypharmachem.com",
//       },
//       {
//         code: "1025",
//         name: "RATNA RAJU SIDDELA",
//         dob: "21-09-1995",
//         branch: "HYDERABAD",
//         email: "raju@densitypharmachem.com",
//       },
//       {
//         code: "1027",
//         name: "Swapna Sonparote",
//         dob: "27-08-1985",
//         branch: "MUMBAI",
//         email: "swapna@densitypharmachem.com",
//       },
//       {
//         code: "1028",
//         name: "Chandra Prakash Rajnath Yadav",
//         dob: "11-10-2001",
//         branch: "MUMBAI",
//         email: "prakash@densitypharmachem.com",
//       },
//     ];

//     // Get current week's Monday to Sunday
//     const today = new Date();
//     const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
//     const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Handle Sunday edge case
    
//     const monday = new Date(today);
//     monday.setDate(today.getDate() + mondayOffset);
    
//     const sunday = new Date(monday);
//     sunday.setDate(monday.getDate() + 6);

//     // Helper function to check if a date falls within the current week
//     const isInCurrentWeek = (dobString) => {
//       const [day, month] = dobString.split('-').map(Number);
      
//       // Create date objects for this year's birthday
//       const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
//       const nextYearBirthday = new Date(today.getFullYear() + 1, month - 1, day);
      
//       // Check if birthday falls within current week (this year or next year)
//       return (thisYearBirthday >= monday && thisYearBirthday <= sunday) ||
//              (nextYearBirthday >= monday && nextYearBirthday <= sunday);
//     };

//     // Helper function to get day of week
//     const getDayOfWeek = (dobString) => {
//       const [day, month] = dobString.split('-').map(Number);
//       const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
//       const nextYearBirthday = new Date(today.getFullYear() + 1, month - 1, day);
      
//       if (thisYearBirthday >= monday && thisYearBirthday <= sunday) {
//         return thisYearBirthday.toLocaleDateString('en-US', { weekday: 'long' });
//       } else if (nextYearBirthday >= monday && nextYearBirthday <= sunday) {
//         return nextYearBirthday.toLocaleDateString('en-US', { weekday: 'long' });
//       }
//       return '';
//     };

//     // Helper function to format date for display
//     const formatBirthdayDate = (dobString) => {
//       const [day, month] = dobString.split('-').map(Number);
//       const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
//                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
//       const dayWithSuffix = (d) => {
//         if (d > 3 && d < 21) return d + 'th';
//         switch (d % 10) {
//           case 1: return d + 'st';
//           case 2: return d + 'nd';
//           case 3: return d + 'rd';
//           default: return d + 'th';
//         }
//       };
      
//       return `${dayWithSuffix(day)} ${monthNames[month - 1]}`;
//     };

//     // Find employees with birthdays in current week
//     const weeklyBirthdayEmployees = employees.filter(emp => isInCurrentWeek(emp.dob));

//     if (weeklyBirthdayEmployees.length === 0) {
//       return res.status(200).json({ 
//         success: true, 
//         message: `No birthdays this week (${formatDate(monday)} - ${formatDate(sunday)})` 
//       });
//     }

//     // Sort employees by birthday date within the week
//     weeklyBirthdayEmployees.sort((a, b) => {
//       const [dayA, monthA] = a.dob.split('-').map(Number);
//       const [dayB, monthB] = b.dob.split('-').map(Number);
      
//       const dateA = new Date(today.getFullYear(), monthA - 1, dayA);
//       const dateB = new Date(today.getFullYear(), monthB - 1, dayB);
      
//       // If date has passed this year, consider next year
//       if (dateA < monday) dateA.setFullYear(today.getFullYear() + 1);
//       if (dateB < monday) dateB.setFullYear(today.getFullYear() + 1);
      
//       return dateA - dateB;
//     });

  
//     const createBirthdayGrid = () => {
//   let grid = `<table style="width:100%; text-align:center;"><tr>`;

//   // Split the list into 3 vertical columns
//   const columns = [[], [], []];
//   weeklyBirthdayEmployees.forEach((emp, i) => {
//     columns[i % 3].push(emp);
//   });

//   for (let col = 0; col < 3; col++) {
//     grid += `<td style="vertical-align: top; padding: 0 10px;">`;
//     columns[col].forEach(emp => {
//       const formattedDate = formatBirthdayDate(emp.dob);
//       grid += `
//         <div style="margin-bottom: 20px;">
//           <div style="font-size: 17px; color: rgb(0, 79, 189); font-weight: bold;">
//             ${emp.name.toUpperCase()}
//           </div>
//           <div style="font-size: 16px; color: rgb(44, 161, 44); font-weight: bold;">
//             ${formattedDate}
//           </div>
//         </div>
//       `;
//     });
//     grid += `</td>`;
//   }

//   grid += `</tr></table>`;
//   return grid;
// };



// const html = `
//   <p style="font-size: 17px; margin: 20px 0;">
//     Dear All,
//   </p>

//   <p style="font-size: 17px; margin: 20px 0;">
//     Wishing you all fabulous and wonderful 
//     <span style="color: rgb(0, 79, 189); font-weight:bold;">HappY</span>
//     <span style="color: rgb(44, 161, 44); font-weight:bold;"> BirthdaY!</span>
//   </p>

//   ${createBirthdayGrid()}

//   <div style="text-align: center; margin: 20px 0;">
//     <img
//       src="https://marketing.densitypharmachem.com/assets/cake.jpg"
//       alt="Birthday"
//       style="max-width: 300px; width: 100%; height: auto;"
//     />
//   </div>

//   <p style="margin-top: 30px;">
//     <strong>Best Regards</strong><br/>
//     <strong>Thanks</strong><br/>
//     <span style="color: #004fbd; font-weight: bold;">Gurpreet</span>
//   </p>
// `;



//     const allEmployeeEmails = employees.map(emp => emp.email);

//     try {
//       const subject = `Upcoming Birthday's Week - ${formatDate(monday)} to ${formatDate(sunday)}`;
      
//       const sendRes = await fetch(
//         `${process.env.API_BASE_URL}/api/email/base_mail`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             from: "gurpreet@densitypharmachem.com",
//             // from: "prakash@densitypharmachem.com",
//             to: allEmployeeEmails,
//             // to:"chandraprakashyadav1110@gmail.com",
//             bcc: ["chandraprakashyadav1110@gmail.com"], // BCC to HR for records
//             subject: subject,
//             body: html,
//           }),
//         }
//       );

//       if (!sendRes.ok) {
//         const errText = await sendRes.text();
//         throw new Error(`base_mail failed: ${errText}`);
//       }

//       return res.status(200).json({
//         success: true,
//         message: `Weekly birthday reminder sent to ${allEmployeeEmails.length} employees`,
//         weekRange: `${formatDate(monday)} - ${formatDate(sunday)}`,
//         birthdayEmployees: weeklyBirthdayEmployees.map(emp => ({
//           name: emp.name,
//           date: formatBirthdayDate(emp.dob),
//           dayOfWeek: getDayOfWeek(emp.dob)
//         }))
//       });

//     } catch (err) {
//       console.error("Failed to send weekly birthday reminder:", err);
//       return res.status(500).json({ error: err.message });
//     }

//   } catch (err) {
//     console.error("Weekly birthday reminder error:", err);
//     return res.status(500).json({ error: err.message });
//   }
// }

//pages/api/email/weekly-birthday-reminder
import { queryDatabase } from "../../../lib/db";
import { formatDate } from "utils/formatDate";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Employee data (same as your original)
    const employees = [
      {
        code: "1001",
        name: "Ramakrishnan Sundaram",
        dob: "24-02-1973",
        branch: "MUMBAI",
        email: "Rama@densitypharmachem.com",
      },
      {
        code: "1002",
        name: "Satish H N",
        dob: "02-11-1977",
        branch: "HYDERABAD",
        email: "satish@densitypharmachem.com",
      },
      {
        code: "1003",
        name: "Jothi Dinesh Kumar",
        dob: "27-07-1976",
        branch: "HYDERABAD",
        email: "dinesh@densitypharmachem.com",
      },
      {
        code: "1004",
        name: "Raghu Bandari",
        dob: "01-01-1982",
        branch: "HYDERABAD",
        email: "raghu@densitypharmachem.com",
      },
      {
        code: "1005",
        name: "Gurpreet Kaur Washist",
        dob: "09-12-1991",
        branch: "MUMBAI",
        email: "gurpreet@densitypharmachem.com",
      },
      {
        code: "1006",
        name: "Bhavani Kulkarni",
        dob: "30-05-1979",
        branch: "HYDERABAD",
        email: "bhavani@densitypharmachem.com",
      },
      {
        code: "1007",
        name: "Pratik Patil",
        dob: "30-08-1987",
        branch: "MUMBAI",
        email: "pratik@densitypharmachem.com",
      },
      {
        code: "1008",
        name: "Mahesh Shegar",
        dob: "07-05-1990",
        branch: "MUMBAI",
        email: "mahesh@densitypharmachem.com",
      },
      {
        code: "1009",
        name: "Saroj Kumar Purohit",
        dob: "27-10-1984",
        branch: "HYDERABAD",
        email: "saroj@densitypharmachem.com",
      },
      {
        code: "1010",
        name: "JITENDAR KUMAR BISHOYI",
        dob: "14-07-1988",
        branch: "HYDERABAD",
        email: "jitendar@densitypharmachem.com",
      },
      {
        code: "1011",
        name: "ARABINDA NANDA",
        dob: "02-07-1983",
        branch: "HYDERABAD",
        email: "arabindia@densitypharmachem.com",
      },
      {
        code: "1012",
        name: "Christy Samuel",
        dob: "29-10-1987",
        branch: "MUMBAI",
        email: "christy@densitypharmachem.com",
      },
      {
        code: "1013",
        name: "Vakkapati Durga Prasad",
        dob: "15-04-1998",
        branch: "HYDERABAD",
        email: "durga@densitypharmachem.com",
      },
      {
        code: "1014",
        name: "Shafiqullah Khan",
        dob: "18-05-1988",
        branch: "MUMBAI",
        email: "shafique@densitypharmachem.com",
      },
      {
        code: "1015",
        name: "Ravindra Patil",
        dob: "05-04-1974",
        branch: "MUMBAI",
        email: "ravindra@densitypharmachem.com",
      },
      {
        code: "1016",
        name: "Kamalnain Kurra",
        dob: "08-09-1972",
        branch: "MUMBAI",
        email: "kamal@densitypharmachem.com",
      },
      {
        code: "1017",
        name: "Jagadish Naidu",
        dob: "22-08-1978",
        branch: "MUMBAI",
        email: "jagadish@densitypharmachem.com",
      },
      {
        code: "1018",
        name: "Maneesh Srivastava",
        dob: "15-01-1981",
        branch: "MUMBAI",
        email: "maneesh@densitypharmachem.com",
      },
      {
        code: "1019",
        name: "Prashant Kadam",
        dob: "01-01-1982",
        branch: "MUMBAI",
        email: "prashant@densitypharmachem.com",
      },
      {
        code: "1020",
        name: "Venkata Manikanth Akula",
        dob: "21-08-1986",
        branch: "HYDERABAD",
        email: "manikanth@densitypharmachem.com",
      },
      {
        code: "1021",
        name: "Kalyan Babu",
        dob: "09-08-1988",
        branch: "HYDERABAD",
        email: "kalyan@densitypharmachem.com",
      },
      {
        code: "1022",
        name: "Sukanya Pogaku",
        dob: "23-10-1998",
        branch: "HYDERABAD",
        email: "sukanya@densitypharmachem.com",
      },
      {
        code: "1023",
        name: "Pratiksha Dabhane",
        dob: "13-01-1993",
        branch: "MUMBAI",
        email: "pratiksha@densitypharmachem.com",
      },
      {
        code: "1024",
        name: "Navavnit Kumar",
        dob: "01-07-1989",
        branch: "HYDERABAD",
        email: "navanit@densitypharmachem.com",
      },
      {
        code: "1025",
        name: "RATNA RAJU SIDDELA",
        dob: "21-09-1995",
        branch: "HYDERABAD",
        email: "raju@densitypharmachem.com",
      },
      {
        code: "1027",
        name: "Swapna Sonparote",
        dob: "27-08-1985",
        branch: "MUMBAI",
        email: "swapna@densitypharmachem.com",
      },
      {
        code: "1028",
        name: "Chandra Prakash Rajnath Yadav",
        dob: "11-10-2001",
        branch: "MUMBAI",
        email: "prakash@densitypharmachem.com",
      },
    ];

    // Get current week's Monday to Sunday
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Handle Sunday edge case
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0); // Start of Monday
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999); // End of Sunday

    // Helper function to check if a date falls within the current week
    const isInCurrentWeek = (dobString) => {
      const [day, month] = dobString.split('-').map(Number);
      
      // Create date objects for this year's birthday at start of day
      const thisYearBirthday = new Date(today.getFullYear(), month - 1, day, 0, 0, 0, 0);
      const nextYearBirthday = new Date(today.getFullYear() + 1, month - 1, day, 0, 0, 0, 0);
      
      // Check if birthday falls within current week (this year or next year)
      const isThisYearInWeek = thisYearBirthday >= monday && thisYearBirthday <= sunday;
      const isNextYearInWeek = nextYearBirthday >= monday && nextYearBirthday <= sunday;
      
      return isThisYearInWeek || isNextYearInWeek;
    };

    // Helper function to get day of week
    const getDayOfWeek = (dobString) => {
      const [day, month] = dobString.split('-').map(Number);
      const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
      const nextYearBirthday = new Date(today.getFullYear() + 1, month - 1, day);
      
      if (thisYearBirthday >= monday && thisYearBirthday <= sunday) {
        return thisYearBirthday.toLocaleDateString('en-US', { weekday: 'long' });
      } else if (nextYearBirthday >= monday && nextYearBirthday <= sunday) {
        return nextYearBirthday.toLocaleDateString('en-US', { weekday: 'long' });
      }
      return '';
    };

    // Helper function to format date for display
    const formatBirthdayDate = (dobString) => {
      const [day, month] = dobString.split('-').map(Number);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const dayWithSuffix = (d) => {
        if (d > 3 && d < 21) return d + 'th';
        switch (d % 10) {
          case 1: return d + 'st';
          case 2: return d + 'nd';
          case 3: return d + 'rd';
          default: return d + 'th';
        }
      };
      
      return `${dayWithSuffix(day)} ${monthNames[month - 1]}`;
    };

    // Find employees with birthdays in current week
    const weeklyBirthdayEmployees = employees.filter(emp => isInCurrentWeek(emp.dob));

    // Debug logging to help troubleshoot
    console.log('Today:', today.toDateString());
    console.log('Monday:', monday.toDateString());
    console.log('Sunday:', sunday.toDateString());
    console.log('Birthday employees found:', weeklyBirthdayEmployees.length);
    
    // Test specific employee (Jitendar with birthday on 14-07)
    const testEmployee = employees.find(emp => emp.code === "1010");
    if (testEmployee) {
      const [day, month] = testEmployee.dob.split('-').map(Number);
      const thisYearBirthday = new Date(today.getFullYear(), month - 1, day, 0, 0, 0, 0);
      console.log('Test employee birthday:', thisYearBirthday.toDateString());
      console.log('Is in current week?', isInCurrentWeek(testEmployee.dob));
    }

    if (weeklyBirthdayEmployees.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: `No birthdays this week (${formatDate(monday)} - ${formatDate(sunday)})`,
        debug: {
          today: today.toDateString(),
          monday: monday.toDateString(),
          sunday: sunday.toDateString(),
          totalEmployees: employees.length
        }
      });
    }

    // Sort employees by birthday date within the week
    weeklyBirthdayEmployees.sort((a, b) => {
      const [dayA, monthA] = a.dob.split('-').map(Number);
      const [dayB, monthB] = b.dob.split('-').map(Number);
      
      const dateA = new Date(today.getFullYear(), monthA - 1, dayA);
      const dateB = new Date(today.getFullYear(), monthB - 1, dayB);
      
      // If date has passed this year, consider next year
      if (dateA < monday) dateA.setFullYear(today.getFullYear() + 1);
      if (dateB < monday) dateB.setFullYear(today.getFullYear() + 1);
      
      return dateA - dateB;
    });

    const createBirthdayGrid = () => {
      let grid = `<table style="width:100%; text-align:center;"><tr>`;

      // Split the list into 3 vertical columns
      const columns = [[], [], []];
      weeklyBirthdayEmployees.forEach((emp, i) => {
        columns[i % 3].push(emp);
      });

      for (let col = 0; col < 3; col++) {
        grid += `<td style="vertical-align: top; padding: 0 10px;">`;
        columns[col].forEach(emp => {
          const formattedDate = formatBirthdayDate(emp.dob);
          grid += `
            <div style="margin-bottom: 20px;">
              <div style="font-size: 17px; color: rgb(0, 79, 189); font-weight: bold;">
                ${emp.name.toUpperCase()}
              </div>
              <div style="font-size: 16px; color: rgb(44, 161, 44); font-weight: bold;">
                ${formattedDate}
              </div>
            </div>
          `;
        });
        grid += `</td>`;
      }

      grid += `</tr></table>`;
      return grid;
    };

    const html = `
      <p style="font-size: 17px; margin: 20px 0;">
        Dear All,
      </p>

      <p style="font-size: 17px; margin: 20px 0;">
        Wishing you all fabulous and wonderful 
        <span style="color: rgb(0, 79, 189); font-weight:bold;">HappY</span>
        <span style="color: rgb(44, 161, 44); font-weight:bold;"> BirthdaY!</span>
      </p>

      ${createBirthdayGrid()}

      <div style="text-align: center; margin: 20px 0;">
        <img
          src="https://marketing.densitypharmachem.com/assets/cake.jpg"
          alt="Birthday"
          style="max-width: 300px; width: 100%; height: auto;"
        />
      </div>

      <p style="margin-top: 30px;">
        <strong>Best Regards</strong><br/>
        <strong>Thanks</strong><br/>
        <span style="color: #004fbd; font-weight: bold;">Gurpreet</span>
      </p>
    `;

    const allEmployeeEmails = employees.map(emp => emp.email);

    try {
      const subject = `Upcoming Birthday's Week - ${formatDate(monday)} to ${formatDate(sunday)}`;
      
      const sendRes = await fetch(
        `${process.env.API_BASE_URL}/api/email/base_mail`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "gurpreet@densitypharmachem.com",
            // from: "prakash@densitypharmachem.com",
            to: allEmployeeEmails,
            // to:"chandraprakashyadav1110@gmail.com",
            bcc: ["chandraprakashyadav1110@gmail.com"], // BCC to HR for records
            subject: subject,
            body: html,
          }),
        }
      );

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        throw new Error(`base_mail failed: ${errText}`);
      }

      return res.status(200).json({
        success: true,
        message: `Weekly birthday reminder sent to ${allEmployeeEmails.length} employees`,
        weekRange: `${formatDate(monday)} - ${formatDate(sunday)}`,
        birthdayEmployees: weeklyBirthdayEmployees.map(emp => ({
          name: emp.name,
          date: formatBirthdayDate(emp.dob),
          dayOfWeek: getDayOfWeek(emp.dob)
        }))
      });

    } catch (err) {
      console.error("Failed to send weekly birthday reminder:", err);
      return res.status(500).json({ error: err.message });
    }

  } catch (err) {
    console.error("Weekly birthday reminder error:", err);
    return res.status(500).json({ error: err.message });
  }
}