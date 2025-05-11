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

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   const { email, password } = req.body;

//   // Validate email presence
//   if (!email) {
//     return res.status(400).json({ message: "Email is required" });
//   }

//   // -------------------- Salesperson and Admin Login --------------------
//   try {
//     const salesResults = await queryDatabase(
//       `SELECT SlpCode, SlpName, email, U_Password, isAdmin FROM OSLP WHERE email = @email`,
//       [{ name: "email", type: sql.VarChar, value: email }]
//     );

//     if (salesResults && salesResults.length > 0) {
//       const user = salesResults[0];
//       const contactCode = user.SlpCode?.toString();
//       const name = user.SlpName;
//       const isAdmin = user.isAdmin?.trim() === "Yes";

//       // Check if password is set (not null, not equal to email, not empty)
//       const passwordIsSet = user.U_Password && user.U_Password !== email && user.U_Password.trim();

//       if (!passwordIsSet) {
//         // Password not set, generate token and redirect to set password
//         const token = jwt.sign(
//           {
//             email,
//             role: isAdmin ? "admin" : "sales_person",
//             name,
//             contactCodes: [contactCode],
//           },
//           process.env.JWT_SECRET,
//           { expiresIn: "1h" }
//         );
//         res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//         console.log("[SALES_LOGIN]", { email, contactCodes: [contactCode], role: isAdmin ? "admin" : "sales_person" });

//         return res.status(200).json({
//           message: "PASSWORD_NOT_SET",
//           token,
//           user: {
//             email,
//             role: isAdmin ? "admin" : "sales_person",
//             name,
//             contactCodes: [contactCode],
//           },
//           showPassword: false,
//         });
//       }

//       // Password is set, require password input
//       if (!password) {
//         return res.status(200).json({ message: "SHOW_PASSWORD_FIELD", showPassword: true });
//       }

//       // Verify password
//       const isMatch = await bcrypt.compare(password, user.U_Password);
//       if (!isMatch) {
//         return res.status(401).json({ message: "Incorrect Password" });
//       }

//       const token = jwt.sign(
//         {
//           email,
//           role: isAdmin ? "admin" : "sales_person",
//           name,
//           contactCodes: [contactCode],
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );
//       res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//       console.log("[SALES_LOGIN]", { email, contactCodes: [contactCode], role: isAdmin ? "admin" : "sales_person" });

//       return res.status(200).json({
//         message: "Login_successful",
//         token,
//         user: {
//           email,
//           role: isAdmin ? "admin" : "sales_person",
//           name,
//           contactCodes: [contactCode],
//         },
//         showPassword: true,
//       });
//     }
//   } catch (error) {
//     console.error("Salesperson login error:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }

//   // -------------------- Customer Login --------------------
//   try {
//     const results = await queryDatabase(
//       `SELECT CntctCode, Name, E_MailL, CardCode, Password FROM OCPR WHERE E_MailL = @email`,
//       [{ name: "email", type: sql.VarChar, value: email }]
//     );

//     if (!results || results.length === 0) {
//       return res.status(401).json({ message: "User Not Found" });
//     }

//     const userWithPassword = results.find((user) => user.Password?.trim());
//     const cardCode = userWithPassword?.CardCode?.trim() || results[0].CardCode?.trim();

//     if (!userWithPassword) {
//       const token = jwt.sign(
//         { email, role: "contact_person", cardCodes: [cardCode] },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );
//       res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//       return res.status(200).json({
//         message: "PASSWORD_NOT_SET",
//         token,
//         user: {
//           email,
//           role: "contact_person",
//           cardCodes: [cardCode],
//         },
//         showPassword: false,
//       });
//     }

//     if (!password) {
//       return res.status(200).json({ message: "SHOW_PASSWORD_FIELD", showPassword: true });
//     }

//     const isMatch = await bcrypt.compare(password, userWithPassword.Password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Incorrect Password" });
//     }

//     const token = jwt.sign(
//       {
//         email,
//         role: "contact_person",
//         name: userWithPassword.Name,
//         cardCodes: [cardCode],
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//     return res.status(200).json({
//       message: "Login_successful",
//       token,
//       user: {
//         email,
//         role: "contact_person",
//         name: userWithPassword.Name,
//         cardCodes: [cardCode],
//       },
//       showPassword: true,
//     });
//   } catch (error) {
//     console.error("Customer login error:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// }

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

// Hardcoded test admin credentials
const TEST_ADMIN = {
  email: "testing@gmail.com",
  password: "12Qwerty",
  name: "Test Admin",
  role: "admin",
  contactCodes: ["ADMIN001"],
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;

  // Validate email presence
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // -------------------- Test Admin Login --------------------
  if (email === TEST_ADMIN.email) {
    if (!password) {
      return res.status(200).json({
        message: "SHOW_PASSWORD_FIELD",
        showPassword: true,
      });
    }

    if (password !== TEST_ADMIN.password) {
      return res.status(401).json({ message: "Incorrect Password" });
    }

    // Create token for test admin
    const token = jwt.sign(
      {
        email: TEST_ADMIN.email,
        role: TEST_ADMIN.role,
        name: TEST_ADMIN.name,
        contactCodes: TEST_ADMIN.contactCodes,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

    console.log("[TEST_ADMIN_LOGIN]", {
      email: TEST_ADMIN.email,
      role: TEST_ADMIN.role,
    });

    return res.status(200).json({
      message: "Login_successful",
      token,
      user: {
        email: TEST_ADMIN.email,
        role: TEST_ADMIN.role,
        name: TEST_ADMIN.name,
        contactCodes: TEST_ADMIN.contactCodes,
      },
      showPassword: true,
    });
  }

  // -------------------- Salesperson and Admin Login --------------------
  try {
    const salesResults = await queryDatabase(
      `SELECT SlpCode, SlpName, email, U_Password, isAdmin FROM OSLP WHERE email = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (salesResults && salesResults.length > 0) {
      const user = salesResults[0];
      const contactCode = user.SlpCode?.toString();
      const name = user.SlpName;
      const isAdmin = user.isAdmin?.trim() === "Yes";

      // Check if password is set (not null, not equal to email, not empty)
      const passwordIsSet =
        user.U_Password && user.U_Password !== email && user.U_Password.trim();

      if (!passwordIsSet) {
        // Password not set, generate token and redirect to set password
        const token = jwt.sign(
          {
            email,
            role: isAdmin ? "admin" : "sales_person",
            name,
            contactCodes: [contactCode],
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

        console.log("[SALES_LOGIN]", {
          email,
          contactCodes: [contactCode],
          role: isAdmin ? "admin" : "sales_person",
        });

        return res.status(200).json({
          message: "PASSWORD_NOT_SET",
          token,
          user: {
            email,
            role: isAdmin ? "admin" : "sales_person",
            name,
            contactCodes: [contactCode],
          },
          showPassword: false,
        });
      }

      // Password is set, require password input
      if (!password) {
        return res
          .status(200)
          .json({ message: "SHOW_PASSWORD_FIELD", showPassword: true });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.U_Password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect Password" });
      }

      const token = jwt.sign(
        {
          email,
          role: isAdmin ? "admin" : "sales_person",
          name,
          contactCodes: [contactCode],
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

      console.log("[SALES_LOGIN]", {
        email,
        contactCodes: [contactCode],
        role: isAdmin ? "admin" : "sales_person",
      });

      return res.status(200).json({
        message: "Login_successful",
        token,
        user: {
          email,
          role: isAdmin ? "admin" : "sales_person",
          name,
          contactCodes: [contactCode],
        },
        showPassword: true,
      });
    }
  } catch (error) {
    console.error("Salesperson login error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }

  // -------------------- Customer Login --------------------
  try {
    const results = await queryDatabase(
      `SELECT CntctCode, Name, E_MailL, CardCode, Password FROM OCPR WHERE E_MailL = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (!results || results.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const userWithPassword = results.find((user) => user.Password?.trim());
    const cardCode =
      userWithPassword?.CardCode?.trim() || results[0].CardCode?.trim();

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
        showPassword: false,
      });
    }

    if (!password) {
      return res
        .status(200)
        .json({ message: "SHOW_PASSWORD_FIELD", showPassword: true });
    }

    const isMatch = await bcrypt.compare(password, userWithPassword.Password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect Password" });
    }

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
      showPassword: true,
    });
  } catch (error) {
    console.error("Customer login error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}