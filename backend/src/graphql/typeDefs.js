const typeDefs = `#graphql
scalar DateTime
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
    myOrders: [Order!]!
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createOrder(items: [OrderItemInput!]!): Order!
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!
  }
    
  type OrderItem {
  id: ID!
  menuItem: MenuItem!
  quantity: Int!
  priceAtOrder: Float!
}

type Order {
  id: ID!
  status: OrderStatus!
  total: Float!
  items: [OrderItem!]!
  createdAt: DateTime!
}

input OrderItemInput {
  menuItemId: ID!
  quantity: Int!
}
`;

module.exports = typeDefs;
