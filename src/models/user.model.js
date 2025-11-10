import { DataTypes } from "sequelize";

function User(sequelize) {
  return sequelize.define("User", {
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM("warehouse", "distributor", "supplier", "user", "admin", "company/owner"),
      allowNull: false,
      defaultValue: "user"
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    owner_type: {
      type: DataTypes.ENUM("warehouse", "distributor", "company/owner"),
      allowNull: true
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: [ "email", "type" ]
      }
    ]
  });
}
export default User;
