import axios from 'axios';

interface Message {
  [key: string]: any;
}

export default async (
  serviceId: string,
  title: string,
  message: Message,
  type: 'danger' | 'warning' | 'good',
): Promise<void> => {
  try {
    await axios({
      url: `https://hooks.slack.com/services/${serviceId}`,
      method: 'POST',
      data: {
        attachments: [
          {
            pretext: `${process.env.cfstack}: ${title}`,
            color: type,
            text: JSON.stringify(message, null, 4),
          },
        ],
      },
    });
  } catch (err) {
    console.error('Error sending slack message', err);
  }
};
