import './ErrorMessage.css';

export type ErrorMessageProps = {
  error: string;
};

function ErrorMessage(props: ErrorMessageProps): JSX.Element | null {
  return <span className="ErrorMessage">{props.error}</span>;
}

export default ErrorMessage;
