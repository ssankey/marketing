//pages/api/email/birthday
import { queryDatabase } from "../../../lib/db";
import { formatDate } from "utils/formatDate";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Get today's date in DD-MM format
    const today = new Date();
    const todayDate = today.getDate().toString().padStart(2, '0');
    const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const todayFormatted = `${todayDate}-${todayMonth}`;
    
    // Employee data (could also be fetched from a database)
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
        email: "ratna@densitypharmachem.com",
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
        dob: "17-06-2001",
        branch: "MUMBAI",
        email: "prakash@densitypharmachem.com",
      },
    ];

    // Find employees with birthday today
    const birthdayEmployees = employees.filter(emp => {
      const dobParts = emp.dob.split('-');
      const empBirthday = `${dobParts[0]}-${dobParts[1]}`;
      return empBirthday === todayFormatted;
    });

    if (birthdayEmployees.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: `No birthdays today (${formatDate(today)})` 
      });
    }

    let success = 0, failure = 0;

    // Send emails to each birthday employee
    for (const emp of birthdayEmployees) {
      try {
        // Extract first name for email
        const firstName = emp.name.split(' ')[0].toLowerCase();
        // const email = `${firstName}@densitypharmachem.company`;
        const email = emp.email;

        
        const html = `
          <div style="font-family: Arial, sans-serif; line-height:1.4; color:#333;">
            <p>Dear ${emp.name},</p>
            <p style="font-size: 18px; color:rgb(24, 155, 221);">
              <strong>Wishing you a very Happy Birthday!</strong> 🎉🎂
            </p>
            <img
                            src="https://marketing.densitypharmachem.com/assets/cake.jpg"
                            alt="Birthday"
                            className="img-fluid"
                            style={{ height: "100px", width: "auto" }}
                          />
            <p>
              On this special day, we at Density Pharmachem want to express our appreciation 
              for your hard work and dedication. May this year bring you success, happiness, 
              and good health!
            </p>
            <p>
              Enjoy your special day to the fullest!
            </p>
            <p>Best Wishes,<br/>
            <strong>Gurpreet</strong></p>
           
          </div>
        `;

        const subject = `Happy Birthday ${firstName}! 🎉`;
        const sendRes = await fetch(
          `${process.env.API_BASE_URL}/api/email/base_mail`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "gurpreet@densitypharmachem.com",
              to: [email],
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

        success++;
      } catch (err) {
        console.error(`Failed to send birthday email to ${emp.name}:`, err);
        failure++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Sent birthday wishes to ${success} employees, ${failure} failures.`,
      employees: birthdayEmployees.map(e => e.name)
    });
  } catch (err) {
    console.error("birthdayWishes error:", err);
    return res.status(500).json({ error: err.message });
  }
}