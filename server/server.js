const express = require("express");
const stripe = require("stripe")("sk_test_YOUR_SECRET_KEY"); // replace with your test secret key
const app = express();

app.use(express.json());
app.use(express.static("../")); // serve HTML/CSS/models

const PRODUCTS = {
  "prod_TfDrG6YjEzxBiO": { price: 1000, name: "Werewolf" },
  "prod_TfDskIkgjdC2N7": { price: 1000, name: "Zombie Werewolf" },
  "prod_TfDtH0eDaAAlxu": { price: 1000, name: "Giant Bunny" },
  "prod_TfDuZyHjnZYoCP": { price: 1000, name: "Giant Skeleton Bunny" }
};

app.post("/create-checkout-session", async (req, res) => {
  const { productId } = req.body;
  const product = PRODUCTS[productId];
  if (!product) return res.status(400).json({ error: "Invalid product" });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: product.name },
            unit_amount: product.price
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/cancel.html"
    });
    res.json({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe session creation failed" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
