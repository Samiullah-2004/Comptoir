import { gql } from "@apollo/client";

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

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!) {
    createCategory(name: $name) {
      id
      name
    }
  }
`;

export const CREATE_MENU_ITEM = gql`
  mutation CreateMenuItem(
    $name: String!
    $price: Float!
    $categoryId: ID!
    $imageUrl: String
  ) {
    createMenuItem(
      name: $name
      price: $price
      categoryId: $categoryId
      imageUrl: $imageUrl
    ) {
      id
      name
      price
      imageUrl
    }
  }
`;

export const UPDATE_MENU_ITEM = gql`
  mutation UpdateMenuItem(
    $id: ID!
    $name: String
    $price: Float
    $available: Boolean
    $imageUrl: String
  ) {
    updateMenuItem(
      id: $id
      name: $name
      price: $price
      available: $available
      imageUrl: $imageUrl
    ) {
      id
      name
      price
      available
      imageUrl
    }
  }
`;

export const DELETE_MENU_ITEM = gql`
  mutation DeleteMenuItem($id: ID!) {
    deleteMenuItem(id: $id)
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;