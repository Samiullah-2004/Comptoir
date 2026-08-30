const typeDefs = `#graphql
  enum Role {
    CUSTOMER
    ADMIN
  }

  enum OrderStatus {
    PENDING
    PREPARING
    READY
    COMPLETED
    CANCELLED
  }

  type Category {
    id: ID!
    name: String!
    menuItems: [MenuItem!]!
  }

  type MenuItem {
    id: ID!
    name: String!
    price: Float!
    imageUrl: String
    available: Boolean!
    category: Category!
  }

  type Query {
    categories: [Category!]!
    menuItems: [MenuItem!]!
  }
`;

module.exports = typeDefs;