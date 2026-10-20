import 'dotenv/config';

import express from 'express';
import authRoutes from './routes/auth-routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);

const startServer = (): void => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
