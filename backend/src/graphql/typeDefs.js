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

  type User {
    id: ID!
    email: String!
    role: Role!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    categories: [Category!]!
    menuItems: [MenuItem!]!
    me: User
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
  }
`;

module.exports = typeDefs;