'use strict';
var Promise = require('bluebird');

module.exports = function(sequelize, DataTypes) {
    var Invoice = sequelize.define('Invoice', {
            status: {
                type: DataTypes.ENUM('pending', 'approved', 'paid'),
                allowNull: false,
                defaultValue: 'pending',
            },
            invoiceId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            due: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            paymentDays: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 14,
            },
        },
        {
            classMethods: {
                associate: function(models) {
                    Invoice.belongsTo(models.Client, {
                        foreignKey: {
                            name: 'receiver',
                            allowNull: false,
                        },
                    });
                    // copy of Client created during approval
                    Invoice.belongsTo(models.InvoiceReceiver, {
                        foreignKey: {
                            name: 'invoiceReceiver',
                            allowNull: true,
                        },
                        constraints: false, // not set initially
                    });
                    Invoice.belongsTo(models.User, {
                        foreignKey: {
                            name: 'sender',
                            allowNull: false,
                        },
                    });

                    // copy of User created during approval
                    Invoice.belongsTo(models.InvoiceSender, {
                        foreignKey: {
                            name: 'invoiceSender',
                            allowNull: true,
                        },
                        constraints: false, // not set initially
                    });

                    // TODO
                    /*
                    Invoice.hasMany(models.InvoiceItem, {
                        constraints: false, // not set initially
                        as: 'invoiceItems',
                    });*/
                },
            },
            instanceMethods: {
                approve: function() {
                    var models = sequelize.models;
                    var invoice = this.dataValues;

                    // TODO: create InvoiceSender and InvoiceReceiver

                    // TODO: tidy up
                    return models.User.findOne({
                        id: invoice.sender,
                    }).then(function(result) {
                        var user = result.dataValues;

                        return models.InvoiceSender.create(user).then(function(res) {
                            var invoiceSender = res.dataValues;

                            return models.Client.findOne({
                                id: invoice.receiver,
                            }).then(function(re) {
                                var client = re.dataValues;

                                return models.InvoiceReceiver.create(client).then(function(r) {
                                    var invoiceReceiver = r.dataValues;

                                    return Invoice.update({
                                        status: 'approved',
                                        invoiceSender: invoiceSender.id,
                                        invoiceReceiver: invoiceReceiver.id,
                                    }, {
                                        where: {
                                            id: invoice.id,
                                        },
                                    }).then(function(ids) {
                                        var id = ids[0];

                                        return Invoice.findOne({
                                            id: id,
                                        });
                                    });
                                });
                            });
                        });
                    });
                },
                pay: function() {
                    var invoice = this.dataValues;

                    if(invoice.status !== 'approved') {
                        return Promise.reject(new Error('Tried to a non-approved invoice'));
                    }

                    return Invoice.update({
                        status: 'paid',
                    }, {
                        where: {
                            id: invoice.id,
                        }
                    }).then(function(ids) {
                        var id = ids[0];

                        return Invoice.findOne({
                            id: id,
                        });
                    });
                }
            },
        }
    );

    return Invoice;
};
