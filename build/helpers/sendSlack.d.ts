interface Message {
  [key: string]: any;
}
declare const _default: (
  serviceId: string,
  title: string,
  message: Message,
  type: 'danger' | 'warning' | 'good',
) => Promise<void>;
export default _default;
