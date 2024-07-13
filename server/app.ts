import express, { Request, Response } from 'express';
import morgan from 'morgan';

const app = express();
app.use(morgan('dev'));

app.use(express.static('www'));

app.get('/api/helloworld', (req: Request, res: Response) => {
  res.json({
    data: 'Hello world!',
  });
});

export default app;
