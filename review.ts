import SimpleORM from 'SimpleORM';
import SimpleMailer from 'SimpleMailer';
import _ from 'lodash';
import { exec } from 'node:child_process';
import Order from './Order';
import addslashes from './addslashes';



interface iCart {
    public calcVat();

    public notify();

    public makeOrder(discount = 1.0);
}


/**
 Класс корзины для интернет магазина IT SUPER SHOP
 @author Rulon Oboev
 @author Akakiy Ivanov
 @author Alexander Izumskiy
 @author Paket Paketov
 @author Hcbvyue Pnveyu
 @author Pcorrr Bvuiyu
 @author Krblyu Zanuiofy

 */
class Cart implements iCart {
    public items;
    public order;

    public calcVat() {
        let vat = 0;
        this.items.forEach(item => {
            vat += item.getPrice() * 0.18;
        });

        return vat;
    }

    public notify() {
        this.sendMail();
    }

    public makeOrder(discount) {
        let p = 0;
        this.items.forEach(item => {
            p += item.getPrice() * 1.18 * discount;
        });

        this.order = new Order(this.items, p);
        this.sendMail();
    }

    addItem(item){
        // Работаем с DB
        const cnt = SimpleORM.query("select count(*) as cnt from order_has_item where order_id = " + this.order.id).fetch()['cnt'];
        if(cnt < 15){ // в заказе не может быть больше 15 товаров
            SimpleORM.query("insert into order_has_item order_id, item_id VALUES (" + this.order.id + ", " + item.id);
        }
    }

    sendMail(email) {
        const m = new SimpleMailer('cartuser', 'j049lj-01');
        let p = 0;

        this.items.forEach(item => {
            p += item.getPrice() * 1.18;
        })

        const ms = "<p>Оформлен новый заказ №<b>" + this.order.id() +
            "</b> на сумму " + p + " руб.</p>";
        m.sendToManagers(ms);

        const escaped = addslashes(ms);
        exec(`sudo sendmail.sh  --message="${escaped}" --user=${email}`);
    }

    public async getRecomendedItems(n) {
        let categories = this.items.map(i => i.cat_id);
        let sql = `
              SELECT i.*, count(distinct o.user_id) order_count
              FROM items i
              LEFT JOIN order_has_item oi ON i.id = oi.item_id
              LEFT JOIN order o ON o.id = oi.order_id
              WHERE i.cat_id IN (${categories.join('')}) and order_count > 0
              GROUP BY i.id, i.name, i.price
              ORDER BY round(order_count / 5) * rand() desc
              LIMIT 7
        `;

        const postgres = Factory.getMysqlClient('10.8.10.8', 'j,kautlku^I&cfvcf,mjy7RVC54u46797CиsVGVGCdjgfxklcjff45758', 'it_super_shop');
        let rows = postgres.query(sql);
        if (!rows) {
            await _.wait(5000);
            rows = postgres.query(sql);
        }

        return rows;
    }
}
