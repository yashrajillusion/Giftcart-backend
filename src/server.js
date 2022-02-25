const express = require("express");

const port = process.env.PORT || 2000;

const path = require("path");

const passport = require("./conflig/google-oauth");

const connect = require("./conflig/db");
// this is the models that we will require for this project

// product will have all the data
const Product = require("./models/product.model");
const productController = require("./controllers/product_controller");
// user will be the current user who is visiting the site
const User = require("./models/user.model");
// const userController = require("./controllers/user_controller");

// wishlist will be depending on user parent child relationship
const Wishlist = require("./models/wishlist.model");
const wishlistController = require("./controllers/wishlist_controller");

// cart will be depending on user parent child relationship
const Cart = require("./models/cart.model");
const cartController = require("./controllers/cart_controller");

// address will be depending on user parent child relationship
const Address = require("./models/address.model");
const addressController = require("./controllers/address_controller");
const adminController = require("./controllers/admin_controller");

const checkoutController = require('./controllers/checkout_controller');

const static_path = path.join(__dirname, "../public");

// console.log('static_path:', static_path)

const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(static_path));

app.set("view engine", "ejs");
// -----------------------------------------GOOGLE OAUTH-----------------------------------------------------
const { newToken, router } = require("./controllers/user_controller");

passport.serializeUser(function (user, done) {
  done(null, user);
  // if you use Model.id as your idAttribute maybe you'd want
  // done(null, user.id);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure",
  }),
  (req, res) => {
    let {user}= req
    const token = newToken(user);
    console.log('token:', token)
    return res.redirect("/index")
  }
);

// use the following routes to render your page with the data you required for your page
// app.use("/admin", adminController);
function updateRequestMethod(req, res, next) {
  if (req.body.method) {
    req.method = req.body.method; // req.method = "delete" route = /users/:id
    return next();
  }
  return next();
}

app.use(updateRequestMethod);

app.use("/cart", cartController);

app.use("/admin", adminController);

app.use("/product", productController);
app.use("/checkout", checkoutController)
app.use("/wishlist_layout", wishlistController);
app.use("/admin", adminController);

app.get("/shopitem/:id", async (req, res) => {
  try {
    const item = await Product.findById(req.params.id).lean().exec();
    res.render("shopitem", { item });
  } catch (err) {
    res.send(err.message);
  }
});

app.use("/shopitem", productController);
app.use("/register", router);

const authenticate = require("./middlewares/authenticate")

app.use("/", async (req, res) => {
  try {
    res.render("index");
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
});

app.use("/admin", (req, res) => {
  try {
    res.render("admin");
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
});


// app.get("/payment", (req, res) => {
//   try {
//     res.render("payment");
//   } catch (err) {
//     return res.status(500).send({ message: err.message });
//   }
// });

app.listen(port, async () => {
  try {
    await connect();
    console.log(`listening to port ${port}`);
  } catch (err) {
    console.log(err.message);
  }
});
