import { gql } from '@apollo/client';

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      menuItems {
        id
        name
        price
        imageUrl
        available
      }
    }
  }
`;
export const GET_MY_ORDERS = gql`
  query GetMyOrders {
    myOrders {
      id
      status
      total
      createdAt
      items {
        quantity
        menuItem {
          name
        }
      }
    }
  }
`;
export const GET_ALL_ORDERS = gql`
  query GetAllOrders {
    allOrders {
      id
      status
      total
      createdAt
      user {
        name
        email
      }
      items {
        quantity
        menuItem {
          name
        }
      }
    }
  }
`;