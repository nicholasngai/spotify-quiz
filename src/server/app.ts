import express from 'express';
import morgan from 'morgan';

const app = express();
app.use(morgan('dev'));

app.use(express.static('www'));

export default app;
