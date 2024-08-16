const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    // credentials: true,
    // optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iepmiic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const productsCollection = client.db("TechBar").collection("products");

        app.get('/allProduct', async (req, res) => {
            const allProduct = await productsCollection.find().toArray();

            res.send(allProduct)
        })


        app.get('/products', async (req, res) => {
            try {
                const { search, brand, category, minPrice, maxPrice, currentPage, sort } = req.query;
                console.log(search, brand, category, minPrice, maxPrice, currentPage, sort);

                // Build the query object
                let query = {};

                if (search) {
                    query.$or = [
                        { ProductName: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ];
                }

                if (brand && brand != "All") {
                    query.Brand = brand; // Direct match for a single brand
                }

                if (category && category != "All") {
                    query.Category = category; // Direct match for a single category
                }

                if (minPrice && maxPrice) {
                    query.Price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
                } else if (minPrice) {
                    query.Price = { $gte: parseFloat(minPrice) };
                } else if (maxPrice) {
                    query.Price = { $lte: parseFloat(maxPrice) };
                }


                // Define the sort order
                let sortOrder = {};
                if (sort === 'low-to-high') {
                    sortOrder.Price = 1; // Ascending
                } else if (sort === 'high-to-low') {
                    sortOrder.Price = -1; // Descending
                } else if (sort === 'newest-first') {
                    sortOrder.ProductCreationDate = -1; // Newest first
                }

                // Fetch products from MongoDB based on the query
                const products = await productsCollection.find(query).toArray();
                // console.log('products=', products);
                const count = products.length;

                const page = parseInt(currentPage);
                const result = await productsCollection.find(query)
                    .sort(sortOrder)
                    .skip(page * 6)
                    .limit(6)
                    .toArray();

                // console.log('products=', result);

                res.send({ count, product: result });
            } catch (error) {
                res.status(500).json({ error: 'Internal Server Error' });
                console.log('does not hit');
            }
        });










        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Tech Bar is on');
})

app.listen(port, () => {
    console.log(`Tech BAr is on port ${port}`);
})