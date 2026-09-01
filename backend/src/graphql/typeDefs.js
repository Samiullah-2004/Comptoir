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
  name: String!
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
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createOrder(items: [OrderItemInput!]!): Order!
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!
    createMenuItem(name: String!, price: Float!, categoryId: ID!, imageUrl: String): MenuItem!
    updateMenuItem(id: ID!, name: String, price: Float, available: Boolean, imageUrl: String): MenuItem!
    deleteMenuItem(id: ID!): Boolean!
    createCategory(name: String!): Category!    
    createCheckoutSession(orderId: ID!): CheckoutSession!
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

type CheckoutSession {
  url: String!
}

input OrderItemInput {
  menuItemId: ID!
  quantity: Int!
}
`;

module.exports = typeDefs;
