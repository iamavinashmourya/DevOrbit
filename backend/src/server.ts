import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import connectDB from './utils/db';

const PORT = process.env.PORT || 4000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
