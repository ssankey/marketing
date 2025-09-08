

    // pages/api/order-lifecycle/order-lifecycle.js
    import { verify } from "jsonwebtoken";
    import { orderlifecycle } from "lib/models/order-lifecycle/order-lifecycle";

    export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        // Check for Bearer token
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header. Use Bearer token.",
        });
        }

        // Extract the token
        const token = authHeader.split(" ")[1];

        // Verify the token
        let decodedToken;
        try {
        decodedToken = verify(token, process.env.JWT_SECRET);
        } catch (err) {
        console.error("Token verification failed:", err);
        return res.status(401).json({ error: "Invalid or expired token" });
        }

        // Extract role and access codes from token
        const isAdmin = decodedToken.role === "admin";
        const contactCodes = decodedToken.contactCodes || [];
        const cardCodes = decodedToken.cardCodes || [];

        // Call the orderlifecycle function with token data
        const results = await orderlifecycle({
        isAdmin,
        contactCodes,
        cardCodes
        });

        // Return the data
        return res.status(200).json(results);

    } catch (error) {
        console.error("Error fetching order lifecycle data:", error);
        return res.status(500).json({ error: "Failed to fetch order lifecycle data" });
    }
    }