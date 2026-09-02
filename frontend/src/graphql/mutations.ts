import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        role
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($items: [OrderItemInput!]!) {
    createOrder(items: $items) {
      id
      status
      total
    }
  }
`;

export const CREATE_CHECKOUT_SESSION = gql`
  mutation CreateCheckoutSession($orderId: ID!) {
    createCheckoutSession(orderId: $orderId) {
      url
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      status
    }
  }
`;