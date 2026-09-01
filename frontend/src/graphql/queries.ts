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