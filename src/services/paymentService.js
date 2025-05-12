import serverURL from "../ServerConfig";

export const paymentService = {
    createTicketPayment: (paymentData) => {
      return fetch(`${serverURL.url}payments/create-ticket-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      }).then(res => res.json());
    },
    confirmPayment: (orderId) => {
      return fetch(`${serverURL.url}payments/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      }).then(res => res.json());
    }
  };