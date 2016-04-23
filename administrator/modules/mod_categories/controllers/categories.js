/**
 * @license
 * Copyright (c) 2016 The {life-parser} Project Authors. All rights reserved.
 * This code may only be used under the MIT style license found at http://100dayproject.github.io/LICENSE.txt
 * The complete set of authors may be found at http://100dayproject.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://100dayproject.github.io/CONTRIBUTORS.txt
 * Code distributed by 100dayproject as part of the life.
 */

"use strict";

let module_name = 'mod_categories',
    _module = new __viewRender('backend', module_name),
    Promise = require('bluebird');

_module.list = function (req, res) {

    let toolbar = new __.Toolbar();
    toolbar.custom({
        refreshButton: {link: `/${__config.admin_prefix}/categories`},
        searchButton: {},
        deleteButton: {access: true}
    });

    res.locals.tableColumns = [
        {
            column: '_id',
            width: '1%',
            header: ''
        }, {
            column: 'name',
            width: '25%',
            header: 'Tên danh mục'
        }, {
            column: 'alias',
            width: '25%',
            header: 'Alias'
        }, {
            column: 'created_at',
            width: '25%',
            header: 'Ngày tạo',
            type: 'date-range',
            buttonClass: 'fa fa-calendar',
            condition: {
                type: 'none'
            }
        }, {
            width: '20%',
            header: 'Số bài viết'
        }
    ];

    let cond = __.verifyCondition(req.query, {
        pk: 'categories',
        name: 'string',
        created_at: 'date',
        alias: 'string'
    });

    let filter = __.createFilter(req, res, 'categories', {order_by: 'created_at', order_type: 'desc'});

    Promise.all([
        __models.Posts.count(cond, function (err, count) {
            return count;
        }),
        __models.Posts.find(cond).sort(filter.sort).limit(__config.page_size).skip((filter.page - 1) * __config.page_size)
            .exec(function (err, categories) {
            return categories;
        })
    ]).then(function (results) {
        _module.render(req, res, 'index', {
            title: 'Quản lý chuyên mục',
            toolbar: toolbar.render(),
            categories: results[1],
            totalPage: Math.ceil(results[0] / __config.page_size),
            currentPage: filter.page,
            order_by: filter.order_by,
            order_type: filter.order_type
        })
    }).catch(function (error) {
        __.logger.error(error);
        return _module.render_error(req, res, '500');
    });
};

_module.update = function (req, res) {
    let data = {};
    if (req.body.name == 'name') {
        data.name = req.body.value;
    } else {
        data.alias = req.body.value;
    }

    __models.Posts.update({key: 'categories', _id: req.body.pk}, data).exec(function (err, re) {
        if (err) {
            __.logger.error(err);
            res.send({
                type: 'danger',
                message: 'Có lỗi xảy ra!'
            });
        }
        res.send({
            type: 'success',
            message: 'Cập nhật thông tin chuyên mục thành công!'
        });
    })

};

_module.create = function (req, res) {
    new Promise(function (fullfill, reject) {
        __models.Posts.findOne({key: 'categories', name: req.body.name.trim()}, {_id: 1}, function (err, re) {
            if (err) {
                reject(err);
            } else {
                fullfill(re);
            }
        });
    }).then(function (hasCategory) {
        if (hasCategory) {
            req.flash('warning', 'Danh mục này đã tồn tại!');
            res.redirect(`/${__config.admin_prefix}/categories`);
        } else {
            let newCategory = new __models.Posts({
                key: 'categories',
                name: req.body.name.trim(),
                alias: require('slug')(req.body.name.toLowerCase())
            });

            newCategory.save(function (err) {
                if (err) {
                    __.logger.error(err);
                    req.flash('danger', 'Có lỗi xảy ra!');
                } else {
                    req.flash('success', 'Thêm danh mục thành công!');
                    res.redirect(`/${__config.admin_prefix}/categories`);
                }
            });
        }
    }).catch(function (error) {
        __.logger.error(error);
        req.flash('danger', 'Có lỗi xảy ra!');
    });
};

_module.delete = function (req, res) {
    __models.Posts.remove({key: 'categories', _id: {$in: req.body.ids}})
        .exec(function (err) {
            if (err) {
                __.logger.error(err);
                req.flash('danger', 'Có lỗi kiểm tra!');
                res.sendStatus(200);
            } else {
                req.flash('success', 'Xóa danh mục bài viết thành công!');
                res.sendStatus(200);
            }
        })
};

module.exports = _module;