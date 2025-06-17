

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

// // Hardcoded test admin credentials
// const TEST_ADMIN = {
//   email: "testing@gmail.com",
//   password: "12Qwerty",
//   name: "Test Admin",
//   role: "admin",
//   contactCodes: ["ADMIN001"],
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

//   // -------------------- Test Admin Login --------------------
//   if (email === TEST_ADMIN.email) {
//     if (!password) {
//       return res.status(200).json({
//         message: "SHOW_PASSWORD_FIELD",
//         showPassword: true,
//       });
//     }

//     if (password !== TEST_ADMIN.password) {
//       return res.status(401).json({ message: "Incorrect Password" });
//     }

//     // Create token for test admin
//     const token = jwt.sign(
//       {
//         email: TEST_ADMIN.email,
//         role: TEST_ADMIN.role,
//         name: TEST_ADMIN.name,
//         contactCodes: TEST_ADMIN.contactCodes,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//     console.log("[TEST_ADMIN_LOGIN]", {
//       email: TEST_ADMIN.email,
//       role: TEST_ADMIN.role,
//     });

//     return res.status(200).json({
//       message: "Login_successful",
//       token,
//       user: {
//         email: TEST_ADMIN.email,
//         role: TEST_ADMIN.role,
//         name: TEST_ADMIN.name,
//         contactCodes: TEST_ADMIN.contactCodes,
//       },
//       showPassword: true,
//     });
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
//       const passwordIsSet =
//         user.U_Password &&
//         user.U_Password !== email &&
//         user.U_Password.trim() !== "";

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

//         console.log("[SALES_LOGIN_PASSWORD_NOT_SET]", {
//           email,
//           contactCodes: [contactCode],
//           role: isAdmin ? "admin" : "sales_person",
//         });

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
//         return res.status(200).json({
//           message: "SHOW_PASSWORD_FIELD",
//           showPassword: true,
//         });
//       }

//       // Verify password
//       let isMatch = false;
//       try {
//         if (!user.U_Password || typeof user.U_Password !== "string") {
//           console.error(
//             "[LOGIN] Invalid password hash format for user:",
//             email
//           );
//           return res
//             .status(500)
//             .json({ message: "Authentication system error" });
//         } else {
//           console.log("[LOGIN] Verifying password for:", email);
//           isMatch = await bcrypt.compare(password, user.U_Password);
//           console.log("[LOGIN] Password verification result:", isMatch);
//         }
//       } catch (err) {
//         console.error("[LOGIN] Password comparison error:", err);
//         return res.status(500).json({ message: "Authentication error" });
//       }

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

//       console.log("[SALES_LOGIN_SUCCESS]", {
//         email,
//         contactCodes: [contactCode],
//         role: isAdmin ? "admin" : "sales_person",
//       });

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
//     console.error("[LOGIN] Salesperson login error:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
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
//     const cardCode =
//       userWithPassword?.CardCode?.trim() || results[0].CardCode?.trim();

//     if (!userWithPassword) {
//       // Generate token for password setup
//       const token = jwt.sign(
//         {
//           email,
//           role: "contact_person",
//           cardCodes: [cardCode],
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: "1h" }
//       );

//       res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

//       console.log("[CUSTOMER_LOGIN_PASSWORD_NOT_SET]", {
//         email,
//         cardCodes: [cardCode],
//       });

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
//       return res.status(200).json({
//         message: "SHOW_PASSWORD_FIELD",
//         showPassword: true,
//       });
//     }

//     let isMatch = false;
//     try {
//       isMatch = await bcrypt.compare(password, userWithPassword.Password);
//     } catch (error) {
//       console.error("[LOGIN] Customer password comparison error:", error);
//       return res.status(500).json({ message: "Authentication error" });
//     }

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

//     console.log("[CUSTOMER_LOGIN_SUCCESS]", {
//       email,
//       cardCodes: [cardCode],
//     });

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
//     console.error("[LOGIN] Customer login error:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
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
        user.U_Password &&
        user.U_Password !== email &&
        user.U_Password.trim() !== "";

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

        console.log("[SALES_LOGIN_PASSWORD_NOT_SET]", {
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
        return res.status(200).json({
          message: "SHOW_PASSWORD_FIELD",
          showPassword: true,
        });
      }

      // Verify password
      let isMatch = false;
      try {
        if (!user.U_Password || typeof user.U_Password !== "string") {
          console.error(
            "[LOGIN] Invalid password hash format for user:",
            email
          );
          return res
            .status(500)
            .json({ message: "Authentication system error" });
        } else {
          console.log("[LOGIN] Verifying password for:", email);
          isMatch = await bcrypt.compare(password, user.U_Password);
          console.log("[LOGIN] Password verification result:", isMatch);
        }
      } catch (err) {
        console.error("[LOGIN] Password comparison error:", err);
        return res.status(500).json({ message: "Authentication error" });
      }

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

      console.log("[SALES_LOGIN_SUCCESS]", {
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
    console.error("[LOGIN] Salesperson login error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }

  // -------------------- Employee (OHEM) Login --------------------
  try {
    const employeeResults = await queryDatabase(
      `SELECT firstName, lastName, email, U_Password FROM OHEM WHERE email = @email`,
      [{ name: "email", type: sql.VarChar, value: email }]
    );

    if (employeeResults && employeeResults.length > 0) {
      const user = employeeResults[0];
      const name = `${user.firstName} ${user.lastName}`;
      const slpCode = "19"; // Default SLP code for employees

      // Check if password is set
      const passwordIsSet =
        user.U_Password &&
        user.U_Password !== email &&
        user.U_Password.trim() !== "";

      if (!passwordIsSet) {
        // Password not set, generate token and redirect to set password
        const token = jwt.sign(
          {
            email,
            role: "sales_person",
            name,
            contactCodes: [slpCode],
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

        console.log("[EMPLOYEE_LOGIN_PASSWORD_NOT_SET]", {
          email,
          contactCodes: [slpCode],
          role: "sales_person",
        });

        return res.status(200).json({
          message: "PASSWORD_NOT_SET",
          token,
          user: {
            email,
            role: "sales_person",
            name,
            contactCodes: [slpCode],
          },
          showPassword: false,
        });
      }

      // Password is set, require password input
      if (!password) {
        return res.status(200).json({
          message: "SHOW_PASSWORD_FIELD",
          showPassword: true,
        });
      }

      // Verify password
      let isMatch = false;
      try {
        if (!user.U_Password || typeof user.U_Password !== "string") {
          console.error("[LOGIN] Invalid password hash format for employee:", email);
          return res.status(500).json({ message: "Authentication system error" });
        } else {
          console.log("[LOGIN] Verifying password for employee:", email);
          isMatch = await bcrypt.compare(password, user.U_Password);
          console.log("[LOGIN] Employee password verification result:", isMatch);
        }
      } catch (err) {
        console.error("[LOGIN] Employee password comparison error:", err);
        return res.status(500).json({ message: "Authentication error" });
      }

      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect Password" });
      }

      const token = jwt.sign(
        {
          email,
          role: "sales_person",
          name,
          contactCodes: [slpCode],
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

      console.log("[EMPLOYEE_LOGIN_SUCCESS]", {
        email,
        contactCodes: [slpCode],
        role: "sales_person",
      });

      return res.status(200).json({
        message: "Login_successful",
        token,
        user: {
          email,
          role: "sales_person",
          name,
          contactCodes: [slpCode],
        },
        showPassword: true,
      });
    }
  } catch (error) {
    console.error("[LOGIN] Employee login error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
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
      // Generate token for password setup
      const token = jwt.sign(
        {
          email,
          role: "contact_person",
          cardCodes: [cardCode],
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.setHeader("Set-Cookie", serialize("token", token, COOKIE_OPTIONS));

      console.log("[CUSTOMER_LOGIN_PASSWORD_NOT_SET]", {
        email,
        cardCodes: [cardCode],
      });

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
      return res.status(200).json({
        message: "SHOW_PASSWORD_FIELD",
        showPassword: true,
      });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, userWithPassword.Password);
    } catch (error) {
      console.error("[LOGIN] Customer password comparison error:", error);
      return res.status(500).json({ message: "Authentication error" });
    }

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

    console.log("[CUSTOMER_LOGIN_SUCCESS]", {
      email,
      cardCodes: [cardCode],
    });

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
    console.error("[LOGIN] Customer login error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}