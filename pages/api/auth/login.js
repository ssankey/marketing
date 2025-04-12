
// //pages/api/auth/logn.js
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { queryDatabase } from "lib/db";
// import sql from "mssql";
// import { serialize } from "cookie";

// const COOKIE_OPTIONS = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: "strict",
//   path: "/",
//   maxAge: 3600,
// };

// const ADMIN_CREDENTIALS = {
//   email: "satish@densitypharmachem.com",
//   password: "Satish@123",
// };

// const salesPersons = [
//   ["Sr.", "Contact Code", "Display name", "Email ID"],
//   [1, 1, "Bhavani", "bhavani@densitypharmachem.com"],
//   [2, 6, "Christy", "christy@densitypharmachem.com"],
//   [3, 3, "Dinesh", "dinesh@densitypharmachem.com"],
//   [4, 13, "Jagadish", "jagadish@densitypharmachem.com"],
//   [5, 16, "Kalyan", "kalyan@densitypharmachem.com"],
//   [6, 14, "Kamal", "kamal@densitypharmachem.com"],
//   [7, 8, "Mahesh", "mahesh@densitypharmachem.com"],
//   [8, 11, "Maneesh", "maneesh@densitypharmachem.com"],
//   [9, 12, "Prashant", "prashant@densitypharmachem.com"],
//   [10, 7, "Pratik", "pratik@densitypharmachem.com"],
//   [11, 10, "Raghu", "raghu@densitypharmachem.com"],
//   [12, 2, "Rama", "rama@densitypharmachem.com"],
//   [13, 15, "Ravindra", "ravindra@densitypharmachem.com"],
//   [14, 5, "Saroj", "saroj@densitypharmachem.com"],
//   [15, 9, "Shafique", "shafique@densitypharmachem.com"],
// ];

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   const { email, password } = req.body;

//   // Admin login
//   if (email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
//     if (!password)
//       return res.status(200).json({ message: "SHOW_PASSWORD_FIELD" });
//     if (password !== ADMIN_CREDENTIALS.password)
//       return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
//       expiresIn: "1h",
//     });
//     res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//     return res.status(200).json({
//       message: "Login_successful",
//       token,
//       user: { email, role: "admin", name: "Admin" },
//     });
//   }

//   // Salesperson login

//   const matchedSales = salesPersons.find(
//     (row, i) => i !== 0 && row[3].toLowerCase() === email.toLowerCase()
//   );

//   if (matchedSales) {
//     const contactCode = matchedSales[1]?.toString();
//     const name = matchedSales[2];

//     if (!password)
//       return res.status(200).json({ message: "SHOW_PASSWORD_FIELD" });

//     // PASSWORD_NOT_SET logic
//     if (password !== email) {
//       const token = jwt.sign(
//         { email, role: "sales_person", name, contactCodes: [contactCode] 

//         },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );
//       res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//       console.log("[SALES_LOGIN][PASSWORD_NOT_SET]", {
//         email,
//         contactCodes: [contactCode],
//       });

//       return res.status(200).json({
//         message: "PASSWORD_NOT_SET",
//         token,
//         user: {
//           email,
//           role: "sales_person",
//           name,
//           contactCodes: [contactCode],
//         },
//       });
//     }

   
//     const token = jwt.sign(
//       {
//         email,
//         role: "contact_person",
//         contactCodes,
//         cardCodes: [userWithPassword.CardCode.trim()],
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//     console.log("[SALES_LOGIN][SUCCESS]", {
//       email,
//       contactCodes: [contactCode],
//     });

//     return res.status(200).json({
//       message: "Login_successful",
//       token,
//       user: {
//         email,
//         role: "sales_person",
//         name,
//         contactCodes: [contactCode],
//       },
//     });
//   }

//   // Customer login
//   try {
//     const results = await queryDatabase(
//       `SELECT CntctCode, Name, E_MailL, CardCode, Password FROM ocpr WHERE E_MailL = @email`,
//       [{ name: "email", type: sql.VarChar, value: email }]
//     );

//     if (!results || results.length === 0)
//       return res.status(401).json({ message: "User Not Found" });
//     if (!password)
//       return res.status(200).json({ message: "SHOW_PASSWORD_FIELD" });

//     const contactCodes = results.map((user) =>
//       user.CntctCode.toString().trim()
//     );
//     const userWithPassword = results.find((user) => user.Password?.trim());

//     if (!userWithPassword) {
  
//     const token = jwt.sign(
//       {
//         email,
//         role: "contact_person",
//         contactCodes,
//         cardCodes: [userWithPassword.CardCode.trim()],
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );


//       res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//       return res.status(200).json({
//         message: "PASSWORD_NOT_SET",
//         token,
//         user: {
//           email,
//           role: "contact_person",
//           contactCodes,
//         },
//       });
//     }

//     const isMatch = await bcrypt.compare(password, userWithPassword.Password);
//     if (!isMatch)
//       return res.status(401).json({ message: "Incorrect Password" });


//     const token = jwt.sign(
//       {
//         email,
//         role: "contact_person",
//         contactCodes,
//         cardCodes: [userWithPassword.CardCode.trim()],
//       },

//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//     return res.status(200).json({
//       message: "Login_successful",
//       token,
//       //   user: {
//       //     email,
//       //     role: "contact_person",
//       //     name: userWithPassword.Name,
//       //     cardCode: userWithPassword.CardCode,
//       //     contactCodes,
//       //   },
//       user: {
//         email,
//         role: "contact_person",
//         name: userWithPassword.Name,
//         cardCode: userWithPassword.CardCode,
//         cardCodes: [userWithPassword.CardCode.trim()],
//         contactCodes,
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     return res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// }


// pages/api/auth/logn.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { queryDatabase } from "lib/db";
import sql from "mssql";
import { serialize } from "cookie";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 3600,
};

const ADMIN_CREDENTIALS = {
  email: "satish@densitypharmachem.com",
  password: "Satish@123",
};

const salesPersons = [
  ["Sr.", "Contact Code", "Display name", "Email ID"],
  [1, 1, "Bhavani", "bhavani@densitypharmachem.com"],
  [2, 6, "Christy", "christy@densitypharmachem.com"],
  [3, 3, "Dinesh", "dinesh@densitypharmachem.com"],
  [4, 13, "Jagadish", "jagadish@densitypharmachem.com"],
  [5, 16, "Kalyan", "kalyan@densitypharmachem.com"],
  [6, 14, "Kamal", "kamal@densitypharmachem.com"],
  [7, 8, "Mahesh", "mahesh@densitypharmachem.com"],
  [8, 11, "Maneesh", "maneesh@densitypharmachem.com"],
  [9, 12, "Prashant", "prashant@densitypharmachem.com"],
  [10, 7, "Pratik", "pratik@densitypharmachem.com"],
  [11, 10, "Raghu", "raghu@densitypharmachem.com"],
  [12, 2, "Rama", "rama@densitypharmachem.com"],
  [13, 15, "Ravindra", "ravindra@densitypharmachem.com"],
  [14, 5, "Saroj", "saroj@densitypharmachem.com"],
  [15, 9, "Shafique", "shafique@densitypharmachem.com"],
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;

  // -------------------- Admin Login --------------------
  if (email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
    if (!password) return res.status(200).json({ message: "SHOW_PASSWORD_FIELD" });
    if (password !== ADMIN_CREDENTIALS.password)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

    return res.status(200).json({
      message: "Login_successful",
      token,
      user: { email, role: "admin", name: "Admin" },
    });
  }

  // -------------------- Salesperson Login --------------------
  const matchedSales = salesPersons.find(
    (row, i) => i !== 0 && row[3].toLowerCase() === email.toLowerCase()
  );

  if (matchedSales) {
    const contactCode = matchedSales[1]?.toString();
    const name = matchedSales[2];

    if (!password) return res.status(200).json({ message: "SHOW_PASSWORD_FIELD" });

    const token = jwt.sign(
      { email, role: "sales_person", name, contactCodes: [contactCode] },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

    console.log("[SALES_LOGIN]", { email, contactCodes: [contactCode] });

    return res.status(200).json({
      message: password !== email ? "PASSWORD_NOT_SET" : "Login_successful",
      token,
      user: {
        email,
        role: "sales_person",
        name,
        contactCodes: [contactCode],
      },
    });
  }

  // -------------------- Customer Login --------------------
  try {
    const results = await queryDatabase(
      `SELECT CntctCode, Name, E_MailL, CardCode, Password FROM ocpr WHERE E_MailL = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (!results || results.length === 0)
      return res.status(401).json({ message: "User Not Found" });
    if (!password) return res.status(200).json({ message: "SHOW_PASSWORD_FIELD" });

    const userWithPassword = results.find((user) => user.Password?.trim());
    const cardCode = userWithPassword?.CardCode?.trim();

    if (!userWithPassword) {
      const token = jwt.sign(
        { email, role: "contact_person", cardCodes: [cardCode] },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

      return res.status(200).json({
        message: "PASSWORD_NOT_SET",
        token,
        user: {
          email,
          role: "contact_person",
          cardCodes: [cardCode],
        },
      });
    }

    const isMatch = await bcrypt.compare(password, userWithPassword.Password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect Password" });

    const token = jwt.sign(
      {
        email,
        role: "contact_person",
        name: userWithPassword.Name,
        cardCodes: [cardCode],
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

    return res.status(200).json({
      message: "Login_successful",
      token,
      user: {
        email,
        role: "contact_person",
        name: userWithPassword.Name,
        cardCodes: [cardCode],
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
