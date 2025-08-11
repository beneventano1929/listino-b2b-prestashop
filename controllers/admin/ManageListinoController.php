<?php
require_once _PS_MODULE_DIR_.'listino_b2b/classes/ProductListino.php';

class ManageListinoController extends ModuleAdminController
{
    public function __construct()
    {
        $this->bootstrap = true;
        $this->table = 'product';
        $this->className = 'Product';
        $this->lang = false;

        parent::__construct();
    }

    public function initContent()
    {
        parent::initContent();

        // 1️⃣ Recupero Gruppi Clienti disponibili
        $groups = Group::getGroups((int)Context::getContext()->language->id);

        // 2️⃣ Modalità di selezione: gruppo o cliente specifico
        $selection_type = Tools::getValue('selection_type', 'group'); // 'group' o 'customer'
         // <-- INIZIALIZZI QUI DIRETTAMENTE

        $selected_target_names = [];



            $selected_groups = []; // <<--- Aggiungi sempre questa riga per azzerare la variabile!

            $id_groups_param = Tools::getValue('id_groups', []);
            if (is_array($id_groups_param)) {
                $selected_groups = array_map('intval', $id_groups_param);
            } elseif ((int)$id_groups_param > 0) {
                $selected_groups = [(int)$id_groups_param];
            }

            foreach ($groups as $group) {
                if (in_array($group['id_group'], $selected_groups)) {
                    $selected_target_names[] = $group['name'];
                }
            }

            $selected_customer = (int)Tools::getValue('id_customer', 0);

            if ($selected_customer > 0) {
                $customer = new Customer($selected_customer);

                if ($customer->id) {
                    $selected_target_names[] = $customer->firstname . ' ' . $customer->lastname . ' (' . $customer->email . ')';
                    $selected_target_names_customer[] = $customer->firstname . ' ' . $customer->lastname . ' (' . $customer->email . ')';
                }
            }

        // 3️⃣ Recupera le Categorie selezionate
        $id_categories_param = Tools::getValue('id_categories');
        $id_categories = [];

        if (!empty($id_categories_param)) {
            if (is_array($id_categories_param)) {
                $id_categories = $id_categories_param;
            } else {
                $id_categories = explode(',', $id_categories_param);
            }
        }

        // 4️⃣ Alberatura Categorie
        $category_tree = $this->renderCategoryTree($id_categories);

        // 5️⃣ Carica Prodotti SOLO se ci sono categorie selezionate
        $products = [];
        if (!empty($id_categories)) {

                $products = ProductListino::getProductsListinoMultiTarget($id_categories, $selected_groups,$selected_customer, []);

        }

        // 6️⃣ Passa dati alla View

        $this->context->smarty->assign([
            'selected_groups' => $selected_groups,  // <-- OK
            'selection_type' => $selection_type,
            'selected_target_names' => $selected_target_names,
            'selected_customer' => $selected_customer,
            'groups' => $groups,
            'customer' => $selected_target_names_customer,
            'selected_categories' => $id_categories,
            'category_tree' => $category_tree,
            'products' => $products,
            'has_categories_selected' => !empty($id_categories),
        ]);

        // 7️⃣ Carica il Template
        $this->context->controller->tpl_folder = 'modules/listino_b2b/views/templates/admin/';
        $this->setTemplate('listino.tpl');
    }

    public function postProcess()
    {
        parent::postProcess();

        $id_categories = Tools::getValue('id_categories', []);
        $selection_type = Tools::getValue('selection_type', 'group');
        $selection_type_remove = Tools::getValue('reset_selection_type');

        $id_customer = (int)Tools::getValue('id_customer', 0);

        // Recupera i gruppi selezionati come array
        $selected_groups = Tools::getValue('id_groups', []);
        if (!is_array($selected_groups)) {
            $selected_groups = [$selected_groups];
        }

        // Gestione ricerca clienti AJAX
        if (Tools::getValue('ajax') && Tools::getValue('action') === 'searchCustomers') {
            $this->searchCustomersAjax();
            return;
        }

        // RESET Specific Price
        if (Tools::getValue('reset_specific_price')) {
            $id_product = (int)Tools::getValue('reset_specific_price');
            $reset_group = (int)Tools::getValue('resetSpecificGroup');


            if ($selection_type_remove === 'group' && !empty($selected_groups) && $id_product > 0 && $reset_group > 0 ) {

                 Db::getInstance()->delete('specific_price',
                        'id_product = '.(int)$id_product.' AND id_group = '.(int)$reset_group.' AND id_customer = 0'
                    );


            } elseif ($selection_type_remove === 'customer' && $id_customer > 0) {
                Db::getInstance()->delete('specific_price',
                    'id_product = '.(int)$id_product.' AND id_customer = '.(int)$id_customer.' AND id_group = 0'
                );
            }

            $this->confirmations[] = 'Specific Price eliminato con successo!';
            $this->redirectWithParams($id_categories, $selection_type, $selected_groups, $id_customer);
        }

        // SAVE ALL Specific Prices
        if (Tools::isSubmit('saveAll')) {
            $b2b_prices = Tools::getValue('b2b_prices');
            $b2b_prices_customer = Tools::getValue('b2b_prices_customer');

            if ($b2b_prices && is_array($b2b_prices)) {
                foreach ($b2b_prices as $id_product => $group_prices) {

                    foreach ($group_prices as $id_group => $b2b_price) {
                        $id_product = (int)$id_product;
                        $id_group = (int)$id_group;
                        $b2b_price = (float)$b2b_price;


                        if ($b2b_price <= 0) {
                            continue;
                        }


                        // Salva specific price per questo prodotto e gruppo
                        $this->saveSpecificPrice($id_product, $b2b_price, 'group', $id_group, 0);
                    }

                }

            }
            if ($b2b_prices_customer && is_array($b2b_prices_customer)) {
                foreach ($b2b_prices_customer as $id_product => $group_prices) {

                    foreach ($group_prices as $id_group => $b2b_price) {
                        $id_product = (int)$id_product;
                        $id_group = (int)$id_group;
                        $b2b_price = (float)$b2b_price;


                        if ($b2b_price <= 0) {
                            continue;
                        }


                        // Salva specific price per questo prodotto e gruppo
                        $this->saveSpecificPrice($id_product, $b2b_price, 'group', 0, $id_group);
                    }

                }

            }
            $target_type = ($selection_type === 'group') ? 'gruppo' : 'cliente';
            $this->confirmations[] = "Prezzi Specifici aggiornati per il $target_type selezionato!";
            $this->redirectWithParams($id_categories, $selection_type, $selected_groups, $id_customer);
        }
    }


    /**
     * Salva specific price per gruppo o cliente
     */
    private function saveSpecificPrice($id_product, $b2b_price, $selection_type, $id_group, $id_customer)
    {



        if ($id_group > 0) {

            // Specific price per gruppo
            $exists = Db::getInstance()->getValue(
                'SELECT COUNT(*) FROM '._DB_PREFIX_.'specific_price
                 WHERE id_product = '.(int)$id_product.'
                 AND id_group = '.(int)$id_group.'
                 AND id_customer = 0'
            );

            if ($exists) {
                Db::getInstance()->update('specific_price', [
                    'price' => $b2b_price
                ], 'id_product = '.(int)$id_product.' AND id_group = '.(int)$id_group.' AND id_customer = 0');
            } else {
                $this->createSpecificPrice($id_product, $b2b_price, $id_group, 0);
            }
        } elseif ( $id_customer > 0) {


            // Specific price per cliente
            $exists = Db::getInstance()->getValue(
                'SELECT COUNT(*) FROM '._DB_PREFIX_.'specific_price
                 WHERE id_product = '.(int)$id_product.'
                 AND id_customer = '.(int)$id_customer.'
                 AND id_group = 0'
            );


            if ($exists) {

                Db::getInstance()->update('specific_price', [
                    'price' => $b2b_price
                ], 'id_product = '.(int)$id_product.' AND id_customer = '.(int)$id_customer.' AND id_group = 0');
            } else {

                $this->createSpecificPrice($id_product, $b2b_price, 0, $id_customer);
            }
        }
    }

    /**
     * Crea nuovo specific price
     */
    private function createSpecificPrice($id_product, $price, $id_group = 0, $id_customer = 0)
    {
        $specificPrice = new SpecificPrice();
        $specificPrice->id_product = $id_product;
        $specificPrice->id_group = $id_group;
        $specificPrice->id_customer = $id_customer;
        $specificPrice->id_product_attribute = 0;
        $specificPrice->id_currency = 0;
        $specificPrice->id_country = 0;
        $specificPrice->id_shop = (int)Context::getContext()->shop->id;
        $specificPrice->id_cart = 0;
        $specificPrice->from_quantity = 1;
        $specificPrice->price = $price;
        $specificPrice->reduction_type = 'amount';
        $specificPrice->reduction = 0;
        $specificPrice->from = '0000-00-00 00:00:00';
        $specificPrice->to = '0000-00-00 00:00:00';
        $specificPrice->add();
    }

    /**
     * Gestisce ricerca clienti via AJAX
     */
    private function searchCustomersAjax()
    {
        $query = Tools::getValue('query', '');
        $customers = [];

        if (strlen($query) >= 2) {
            $sql = 'SELECT id_customer, firstname, lastname, email 
                    FROM '._DB_PREFIX_.'customer 
                    WHERE active = 1 
                    AND (
                        firstname LIKE "%'.pSQL($query).'%" 
                        OR lastname LIKE "%'.pSQL($query).'%" 
                        OR email LIKE "%'.pSQL($query).'%"
                    )
                    ORDER BY lastname, firstname
                    LIMIT 10';

            $results = Db::getInstance()->executeS($sql);

            foreach ($results as $customer) {
                $customers[] = [
                    'id_customer' => $customer['id_customer'],
                    'name' => $customer['firstname'] . ' ' . $customer['lastname'],
                    'email' => $customer['email'],
                    'display_name' => $customer['firstname'] . ' ' . $customer['lastname'] . ' (' . $customer['email'] . ')'
                ];
            }
        }

        header('Content-Type: application/json');
        die(json_encode($customers));
    }

    /**
     * Redirect mantenendo i parametri
     */
    private function redirectWithParams($id_categories, $selection_type, $selected_groups = [], $id_customer = 0)
    {
        $redirectUrl = AdminController::$currentIndex . '&token=' . $this->token;

        if (!empty($id_categories)) {
            $redirectUrl .= '&id_categories=' . implode(',', array_map('intval', $id_categories));
        }



        if (!empty($selected_groups)) {
            foreach ($selected_groups as $id_group) {
                $redirectUrl .= '&id_groups[]=' . (int)$id_group;
            }
        }
    if ($id_customer > 0) {
            $redirectUrl .= '&id_customer=' . (int)$id_customer;
        }

        Tools::redirectAdmin($redirectUrl);
    }


    public function renderCategoryTree($selected_categories = [])
    {
        $tree = new HelperTreeCategories('id_categories');
        $tree->setUseCheckBox(true)
            ->setSelectedCategories($selected_categories)
            ->setInputName('id_categories');

        return $tree->render();
    }
}