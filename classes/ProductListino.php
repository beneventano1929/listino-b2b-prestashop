<?php
class ProductListino
{
    /**
     * Recupera prodotti con prezzi specifici per gruppo
     */
    public static function getProductsListino($id_categories = [], $id_groups = [])
    {
        $id_groups = array_map('intval', $id_groups);

        $sql = 'SELECT p.id_product, pl.name, p.wholesale_price, ps.price';

        // Dynamically build subqueries for each group
        foreach ($id_groups as $group_id) {
            $sql .= ',
            (SELECT sp.price FROM '._DB_PREFIX_.'specific_price sp
             WHERE sp.id_product = p.id_product 
             AND sp.id_group = '.$group_id.' 
             AND sp.id_customer = 0 
             LIMIT 1) AS group_'.$group_id.'_price';
        }

        $sql .= ' FROM '._DB_PREFIX_.'product p
              INNER JOIN '._DB_PREFIX_.'product_lang pl ON (p.id_product = pl.id_product AND pl.id_lang = '.(int)Context::getContext()->language->id.')
              INNER JOIN '._DB_PREFIX_.'product_shop ps ON (p.id_product = ps.id_product AND ps.id_shop = '.(int)Context::getContext()->shop->id.')
              WHERE p.active = 1';

        if (!empty($id_categories)) {
            $sql .= ' AND EXISTS (
                    SELECT 1 FROM '._DB_PREFIX_.'category_product cp
                    WHERE cp.id_product = p.id_product
                    AND cp.id_category IN ('.implode(',', $id_categories).')
                  )';
        }

        $sql .= ' ORDER BY pl.name ASC';

        return Db::getInstance()->executeS($sql);
    }

    /**
     * Recupera prodotti con prezzi specifici per cliente
     */
    public static function getProductsListinoForCustomer($id_categories = [], $id_customer = 0)
    {
        $sql = 'SELECT p.id_product, pl.name, p.wholesale_price, ps.price,
                   (ps.price - p.wholesale_price) AS margin,
                   (SELECT sp.price FROM '._DB_PREFIX_.'specific_price sp
                    WHERE sp.id_product = p.id_product 
                    AND sp.id_customer = '.(int)$id_customer.' 
                    AND sp.id_group = 0 
                    LIMIT 1) AS b2b_price
            FROM '._DB_PREFIX_.'product p
            INNER JOIN '._DB_PREFIX_.'product_lang pl ON (p.id_product = pl.id_product AND pl.id_lang = '.(int)Context::getContext()->language->id.')
            INNER JOIN '._DB_PREFIX_.'product_shop ps ON (p.id_product = ps.id_product AND ps.id_shop = '.(int)Context::getContext()->shop->id.')
            WHERE p.active = 1';

        if (!empty($id_categories)) {
            $sql .= ' AND EXISTS (
                    SELECT 1 FROM '._DB_PREFIX_.'category_product cp
                    WHERE cp.id_product = p.id_product
                    AND cp.id_category IN ('.implode(',', array_map('intval', $id_categories)).')
                  )';
        }

        $sql .= ' ORDER BY pl.name ASC';

        return Db::getInstance()->executeS($sql);
    }

    /**
     * Recupera prodotti per multi-target (gruppi e clienti multipli)
     * Mostra i prezzi specifici esistenti per tutti i target selezionati
     */
    public static function getProductsListinoMultiTarget($id_categories = [], $selected_groups = [], $selected_customers_ids = [])
    {


        $sql = 'SELECT p.id_product, pl.name, p.wholesale_price, ps.price,
                   (ps.price - p.wholesale_price) AS margin';

        // Aggiungi subquery per ogni gruppo selezionato
        foreach ($selected_groups as $index => $id_group) {
            $sql .= ',
                   (SELECT sp.price FROM '._DB_PREFIX_.'specific_price sp
                    WHERE sp.id_product = p.id_product 
                    AND sp.id_group = '.(int)$id_group.' 
                    AND sp.id_customer = 0 
                    LIMIT 1) AS group_'.$id_group.'_price';
        }

        // Aggiungi subquery per ogni cliente selezionato

       if($selected_customers_ids)
       {

            $sql .= ',
                   (SELECT sp.price FROM '._DB_PREFIX_.'specific_price sp
                    WHERE sp.id_product = p.id_product 
                    AND sp.id_customer = '.(int)$selected_customers_ids.' 
                    AND sp.id_group = 0 
                    LIMIT 1) AS customer_'.$selected_customers_ids.'_price';

        }




        // Per compatibilità con il template, usiamo il primo prezzo trovato come b2b_price
        $sql .= ', COALESCE(';
        $price_sources = [];

        foreach ($selected_groups as $id_group) {
            $price_sources[] = '(SELECT sp.price FROM '._DB_PREFIX_.'specific_price sp
                WHERE sp.id_product = p.id_product 
                AND sp.id_group = '.(int)$id_group.' 
                AND sp.id_customer = 0 
                LIMIT 1)';
        }

        if($selected_customers_ids)
        {
            $price_sources[] = '(SELECT sp.price FROM '._DB_PREFIX_.'specific_price sp
                WHERE sp.id_product = p.id_product 
                AND sp.id_customer = '.(int)$selected_customers_ids.' 
                AND sp.id_group = 0 
                LIMIT 1)';
        }


        if (!empty($price_sources)) {
            $sql .= implode(', ', $price_sources);
        } else {
            $sql .= 'NULL';
        }

        $sql .= ') AS b2b_price';

        $sql .= '
            FROM '._DB_PREFIX_.'product p
            INNER JOIN '._DB_PREFIX_.'product_lang pl ON (p.id_product = pl.id_product AND pl.id_lang = '.(int)Context::getContext()->language->id.')
            INNER JOIN '._DB_PREFIX_.'product_shop ps ON (p.id_product = ps.id_product AND ps.id_shop = '.(int)Context::getContext()->shop->id.')
            WHERE p.active = 1';

        if (!empty($id_categories)) {
            $sql .= ' AND EXISTS (
                    SELECT 1 FROM '._DB_PREFIX_.'category_product cp
                    WHERE cp.id_product = p.id_product
                    AND cp.id_category IN ('.implode(',', array_map('intval', $id_categories)).')
                  )';
        }

        $sql .= ' ORDER BY pl.name ASC';

        return Db::getInstance()->executeS($sql);
    }

    /**
     * Cerca clienti per autocompletamento
     */
    public static function searchCustomers($query, $limit = 10)
    {
        if (strlen($query) < 2) {
            return [];
        }

        $sql = 'SELECT id_customer, firstname, lastname, email 
                FROM '._DB_PREFIX_.'customer 
                WHERE active = 1 
                AND (
                    firstname LIKE "%'.pSQL($query).'%" 
                    OR lastname LIKE "%'.pSQL($query).'%" 
                    OR email LIKE "%'.pSQL($query).'%"
                )
                ORDER BY lastname, firstname
                LIMIT '.(int)$limit;

        $results = Db::getInstance()->executeS($sql);
        $customers = [];

        foreach ($results as $customer) {
            $customers[] = [
                'id_customer' => $customer['id_customer'],
                'name' => $customer['firstname'] . ' ' . $customer['lastname'],
                'email' => $customer['email'],
                'display_name' => $customer['firstname'] . ' ' . $customer['lastname'] . ' (' . $customer['email'] . ')'
            ];
        }

        return $customers;
    }

    /**
     * Verifica se un cliente ha prezzi specifici
     */
    public static function customerHasSpecificPrices($id_customer)
    {
        $count = Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM '._DB_PREFIX_.'specific_price 
             WHERE id_customer = '.(int)$id_customer.' AND id_group = 0'
        );

        return (int)$count > 0;
    }

    /**
     * Verifica se un gruppo ha prezzi specifici
     */
    public static function groupHasSpecificPrices($id_group)
    {
        $count = Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM '._DB_PREFIX_.'specific_price 
             WHERE id_group = '.(int)$id_group.' AND id_customer = 0'
        );

        return (int)$count > 0;
    }

    /**
     * Ottieni statistiche sui prezzi specifici
     */
    public static function getSpecificPriceStats($id_categories = [])
    {
        $categoryFilter = '';
        if (!empty($id_categories)) {
            $categoryFilter = ' AND EXISTS (
                SELECT 1 FROM '._DB_PREFIX_.'category_product cp
                WHERE cp.id_product = sp.id_product
                AND cp.id_category IN ('.implode(',', array_map('intval', $id_categories)).')
            )';
        }

        // Conteggio per gruppi
        $groupCount = Db::getInstance()->getValue(
            'SELECT COUNT(DISTINCT sp.id_product) FROM '._DB_PREFIX_.'specific_price sp
             WHERE sp.id_group > 0 AND sp.id_customer = 0'.$categoryFilter
        );

        // Conteggio per clienti
        $customerCount = Db::getInstance()->getValue(
            'SELECT COUNT(DISTINCT sp.id_product) FROM '._DB_PREFIX_.'specific_price sp
             WHERE sp.id_customer > 0 AND sp.id_group = 0'.$categoryFilter
        );

        return [
            'products_with_group_prices' => (int)$groupCount,
            'products_with_customer_prices' => (int)$customerCount,
            'total_products_with_specific_prices' => (int)$groupCount + (int)$customerCount
        ];
    }
}