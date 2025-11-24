import { DataTypes } from "sequelize";

function Category(sequelize) {
    return sequelize.define("Category", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    })
}
export default Category;


// return sequelize.define("Category", {
//         name: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         description: {
//             type: DataTypes.STRING,
//             allowNull: true
//         },
//         parent_id: {
//             type: DataTypes.INTEGER,
//             allowNull: true
//         },
//         status: {
//             type: DataTypes.BOOLEAN,
//             defaultValue: true
//         },
//     })

// this is the category model which is able to store n no of sub categories.
// and i'm storing only 2 levels. And this is going to use in master product table.

// now confusion is in which way should i store the category value in professional manner which also can help me in show time