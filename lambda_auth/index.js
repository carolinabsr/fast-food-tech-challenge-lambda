const { Client } = require("pg");
const jwt = require("jsonwebtoken");

const dbConfig = {
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
};

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const { cpf } = JSON.parse(event.body);

    if (!cpf) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "CPF is required" }),
      };
    }

    const client = new Client(dbConfig);

    await client.connect();

    const query = "SELECT * FROM customers WHERE cpf = $1";
    const values = [cpf];

    const res = await client.query(query, values);

    await client.end();

    if (res.rows.length > 0) {
      const customer = res.rows[0];
      const token = jwt.sign(
        { cpf: customer.cpf, name: customer.name },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Authentication successful",
          token: token,
        }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "Authentication failed: CPF not found",
        }),
      };
    }
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};
