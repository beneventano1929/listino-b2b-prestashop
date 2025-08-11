<?php
/**
 * Listino B2B Module
 * Enhanced B2B pricing management with group and individual customer support
 *
 * @author PrestaShop Developer
 * @version 2.0.0
 */

if (!defined('_PS_VERSION_'))
    exit;

include_once(_PS_MODULE_DIR_ . 'listino_b2b/ProductListino.php');

class Listino_B2B extends Module
{
    public function __construct()
    {
        $this->name = 'listino_b2b';
        $this->tab = 'pricing_promotion';
        $this->version = '1.0.0';
        $this->author = 'Emilio Grimaldi';
        $this->need_instance = 0;
        $this->ps_versions_compliancy = array('min' => '1.7', 'max' => _PS_VERSION_);
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('B2B Pricing Management');
        $this->description = $this->l('Advanced B2B pricing management with group and customer specific pricing, category filters, and enhanced interface.');
        $this->confirmUninstall = $this->l('Are you sure you want to uninstall this module?');

        if (!Configuration::get('LISTINO_B2B_LIVE_MODE'))
            $this->warning = $this->l('B2B Pricing module is in development mode.');
    }

    public function install()
    {
        if (Shop::isFeatureActive())
            Shop::setContext(Shop::CONTEXT_ALL);

        return parent::install() &&
            $this->registerHook('backOfficeHeader') &&
            $this->installTab() &&
            Configuration::updateValue('LISTINO_B2B_LIVE_MODE', 0) &&
            Configuration::updateValue('LISTINO_B2B_VERSION', $this->version);
    }

    public function uninstall()
    {
        return parent::uninstall() &&
            $this->uninstallTab() &&
            Configuration::deleteByName('LISTINO_B2B_LIVE_MODE') &&
            Configuration::deleteByName('LISTINO_B2B_VERSION');
    }

    /**
     * Install admin tab
     */
    public function installTab()
    {
        $tab = new Tab();
        $tab->active = 1;
        $tab->class_name = 'AdminManageListino';
        $tab->name = array();
        foreach (Language::getLanguages(true) as $lang)
            $tab->name[$lang['id_lang']] = $this->l('B2B Pricing Management');

        $tab->id_parent = (int)Tab::getIdFromClassName('AdminParentCatalog');
        $tab->module = $this->name;
        return $tab->add();
    }

    /**
     * Uninstall admin tab
     */
    public function uninstallTab()
    {
        $id_tab = (int)Tab::getIdFromClassName('AdminManageListino');
        if ($id_tab) {
            $tab = new Tab($id_tab);
            return $tab->delete();
        }
        return true;
    }

    /**
     * Add CSS and JS to back office header
     */
    public function hookBackOfficeHeader()
    {
        if (Tools::getValue('controller') == 'AdminManageListino') {
            $this->context->controller->addCSS($this->_path . 'views/css/b2b-styling.css');
            $this->context->controller->addJS($this->_path . 'views/js/b2b-interactions.js');
        }
    }

    /**
     * Module configuration
     */
    public function getContent()
    {
        $output = '';

        if (Tools::isSubmit('submit' . $this->name)) {
            $live_mode = (int)Tools::getValue('LISTINO_B2B_LIVE_MODE');

            Configuration::updateValue('LISTINO_B2B_LIVE_MODE', $live_mode);
            $output .= $this->displayConfirmation($this->l('Settings updated'));
        }

        return $output . $this->renderForm();
    }

    /**
     * Render configuration form
     */
    public function renderForm()
    {
        $default_lang = (int)Configuration::get('PS_LANG_DEFAULT');

        $fields_form[0]['form'] = array(
            'legend' => array(
                'title' => $this->l('B2B Pricing Settings'),
            ),
            'input' => array(
                array(
                    'type' => 'switch',
                    'label' => $this->l('Live Mode'),
                    'name' => 'LISTINO_B2B_LIVE_MODE',
                    'is_bool' => true,
                    'desc' => $this->l('Enable this option to activate the live mode.'),
                    'values' => array(
                        array(
                            'id' => 'active_on',
                            'value' => true,
                            'label' => $this->l('Enabled')
                        ),
                        array(
                            'id' => 'active_off',
                            'value' => false,
                            'label' => $this->l('Disabled')
                        )
                    ),
                ),
            ),
            'submit' => array(
                'title' => $this->l('Save'),
                'class' => 'btn btn-default pull-right'
            )
        );

        $helper = new HelperForm();
        $helper->module = $this;
        $helper->name_controller = $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        $helper->currentIndex = AdminController::$currentIndex . '&configure=' . $this->name;

        // Default language
        $helper->default_form_language = $default_lang;
        $helper->allow_employee_form_lang = $default_lang;

        // Title and toolbar
        $helper->title = $this->displayName;
        $helper->show_toolbar = true;
        $helper->toolbar_scroll = true;
        $helper->submit_action = 'submit' . $this->name;
        $helper->toolbar_btn = array(
            'save' => array(
                'desc' => $this->l('Save'),
                'href' => AdminController::$currentIndex . '&configure=' . $this->name . '&save' . $this->name .
                    '&token=' . Tools::getAdminTokenLite('AdminModules'),
            ),
            'back' => array(
                'href' => AdminController::$currentIndex . '&token=' . Tools::getAdminTokenLite('AdminModules'),
                'desc' => $this->l('Back to list')
            )
        );

        // Load current value
        $helper->fields_value['LISTINO_B2B_LIVE_MODE'] = Configuration::get('LISTINO_B2B_LIVE_MODE');

        return $helper->generateForm($fields_form);
    }

    /**
     * Get module version
     */
    public function getModuleVersion()
    {
        return $this->version;
    }

    /**
     * Check if module is in live mode
     */
    public function isLiveMode()
    {
        return (bool)Configuration::get('LISTINO_B2B_LIVE_MODE');
    }
}