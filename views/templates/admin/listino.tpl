<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestione Listino B2B</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        {include file='../../css/b2b-styling.css'}
    </style>
</head>
<body>
<div class=" px-4 py-3">
    <!-- Header Section -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <i class="fas fa-list-alt text-primary me-3 fs-2"></i>
                    <div>
                        <h1 class="h2 mb-0 text-primary fw-bold">Gestione Listino B2B</h1>
                        <p class="text-muted mb-0">Configura i prezzi speciali per i gruppi clienti</p>
                    </div>
                </div>
                <div class="badge bg-primary-subtle text-primary fs-6 px-3 py-2">
                    <i class="fas fa-users me-2"></i>Sistema Prezzi B2B
                </div>
            </div>
        </div>
    </div>

    <!-- Control Panel Section -->
    <div class="row mb-4">
        <!-- Target Selection Card (Group or Customer) -->
        <div class="col-lg-6 mb-3">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-primary text-white py-3">
                    <h5 class="card-title mb-0">
                        <i class="fas fa-users me-2"></i>Selezione Target Prezzi
                    </h5>
                </div>
                <div class="card-body">
                    <form method="post" id="targetFilterForm">
                        <!-- Selection Type Toggle -->
                        <div class="mb-3">
                            <label class="form-label fw-semibold">
                                <i class="fas fa-toggle-on me-2 text-primary"></i>Tipo Selezione:
                            </label>

                        </div>

                        <!-- Group Selection -->
                        <div id="groupSelection" class="mb-3" {if $selection_type != 'group'}style="display: none;"{/if}>
                            <label for="groupSelector" class="form-label fw-semibold">
                                <i class="fas fa-user-tag me-2 text-primary"></i>Gruppo Clienti:
                            </label>
                            <select id="groupSelector" name="id_groups[]" class="form-select form-select-lg" style="min-height: 200px;" multiple>
                                {foreach from=$groups item=group}
                                    <option value="{$group.id_group}" {if in_array($group.id_group, $selected_groups)}selected{/if}>
                                        {$group.name}
                                    </option>
                                {/foreach}
                            </select>
                        </div>
                        <label for="customerSearch" class="form-label fw-semibold">
                            <i class="fas fa-user-search me-2 text-success"></i>Cerca Cliente:
                        </label>
                        <div class="position-relative">
                            <input type="text" id="customerSearch" class="form-control" placeholder="Digita nome o email..." autocomplete="off">
                            <div id="customerResults" class="position-absolute w-100 bg-white border shadow-sm" style="z-index: 1000; display: none;"></div>
                        </div>

                        <!-- Badge con clienti selezionati -->
                        <div id="selectedCustomers" class="mt-3 d-flex flex-wrap gap-2"></div>

                        <!-- Customer Selection -->
                        <div id="customerSelection" class="mb-3" {if $selection_type != 'customer'}style="display: none;"{/if}>
                            <label for="customerSearch" class="form-label fw-semibold">
                                <i class="fas fa-user-search me-2 text-success"></i>Cerca Cliente:
                            </label>
                            <div class="position-relative">
                                <input type="text" id="customerSearch" class="form-control form-control-lg"
                                       placeholder="Digita nome, cognome o email..." autocomplete="off">
                                <input type="hidden" name="id_customer" id="selectedCustomerId" value="{$selected_customer}">
                                <div id="customerResults" class="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm" style="z-index: 1000; display: none;"></div>
                            </div>
                            {if $selected_customer > 0}
                                <div id="selectedCustomerInfo" class="mt-2 p-2 bg-success bg-opacity-10 border border-success rounded">
                                    <small class="text-success">
                                        <i class="fas fa-check-circle me-1"></i>Cliente selezionato: <strong>{$selected_target_name}</strong>
                                    </small>
                                </div>
                            {/if}
                        </div>
                        {foreach from=$selected_categories item=cat}
                            <input type="hidden" name="id_categories[]" value="{$cat}">
                        {/foreach}
                        <button type="submit" class="btn btn-primary btn-lg w-100" id="selectTargetBtn">
                            <i class="fas fa-download me-2"></i>Seleziona Target
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Category Filter Card -->
        <div class="col-lg-6 mb-3">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-success text-white py-3">
                    <h5 class="card-title mb-0">
                        <i class="fas fa-filter me-2"></i>Filtro Categorie
                    </h5>
                </div>
                <div class="card-body">
                    <form method="post">
                        <div class="mb-3" style="min-height: 355px;">
                            <label class="form-label fw-semibold">
                                <i class="fas fa-sitemap me-2 text-success"></i>Seleziona Categorie:
                            </label>
                            <div class="category-tree-container" style="min-height: 325px">
                                {$category_tree nofilter}
                            </div>
                        </div>
                        <input type="hidden" name="selection_type" value="{$selection_type}">
                        {foreach from=$selected_groups item=group_id}
                            <input type="hidden" name="id_groups[]" value="{$group_id}">
                        {/foreach}
                        <input type="hidden" name="id_customer" value="{$selected_customer}">

                        <button type="submit" class="btn btn-success btn-lg w-100">
                            <i class="fas fa-filter me-2"></i>Applica Filtro
                        </button>

                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Current Target Info -->

    {if $selected_target_names|@count > 0}
        <div class="row mb-4">
            <div class="col-12">
                <div class="alert alert-info border-0 shadow-sm">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-info-circle me-3 fs-4"></i>
                        <div>
                            <h6 class="alert-heading mb-1">Target Attivo</h6>
                            <p class="mb-0">
                                {if $selection_type == 'group'}
                                    Stai lavorando con i gruppi:
                                    {foreach from=$selected_target_names item=groupName}
                                        <span class="badge bg-primary me-1">{$groupName}</span>
                                    {/foreach}
                                {else}
                                    Stai lavorando con il cliente: <strong>{$selected_target_names[0]}</strong>
                                {/if}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}


    <!-- No Categories Selected Notice -->
    {if !$has_categories_selected}
        <div class="row mb-4">
            <div class="col-12">
                <div class="alert alert-warning border-0 shadow-sm">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-exclamation-triangle me-3 fs-4"></i>
                        <div>
                            <h6 class="alert-heading mb-1">Seleziona Categorie</h6>
                            <p class="mb-0">Seleziona almeno una categoria per visualizzare i prodotti e iniziare a configurare i prezzi specifici.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    {if $has_categories_selected}
        <!-- Search and Filter Toolbar -->
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-light py-3">
                <h5 class="card-title mb-0">
                    <i class="fas fa-search me-2 text-primary"></i>Ricerca e Filtri
                </h5>
            </div>
            <div class="card-body py-3">
                <div class="row align-items-end mb-3">
                    <div class="col-lg-4 mb-3 mb-lg-0">
                        <label class="form-label fw-semibold">
                            <i class="fas fa-search me-2 text-primary"></i>Ricerca Prodotti:
                        </label>
                        <input type="text" id="productSearch" placeholder="Cerca per nome o ID..." class="form-control">
                    </div>
                    <div class="col-lg-3 mb-3 mb-lg-0">
                        <label class="form-label fw-semibold">
                            <i class="fas fa-percentage me-2 text-info"></i>Filtro Margine:
                        </label>
                        <select id="marginFilter" class="form-select">
                            <option value="">Tutti i margini</option>
                            <option value="above-0">Margine > 0%</option>
                            <option value="above-10">Margine > 10%</option>
                            <option value="above-20">Margine > 20%</option>
                            <option value="above-30">Margine > 30%</option>
                            <option value="below-10">Margine < 10%</option>
                            <option value="below-20">Margine < 20%</option>
                            <option value="no-margin">Senza margine</option>
                        </select>
                    </div>
                    <div class="col-lg-2 mb-3 mb-lg-0">
                        <label class="form-label fw-semibold">
                            <i class="fas fa-sort me-2 text-success"></i>Ordina per:
                        </label>
                        <select id="sortBy" class="form-select">
                            <option value="id">ID Prodotto</option>
                            <option value="name">Nome</option>
                            <option value="wholesale_price">Prezzo Acquisto</option>
                            <option value="price">Prezzo Vendita</option>
                            <option value="margin">Margine %</option>
                            <option value="b2b_price">Prezzo B2B</option>
                        </select>
                    </div>
                    <div class="col-lg-1 mb-3 mb-lg-0">
                        <button type="button" id="sortDirection" class="btn btn-outline-secondary" title="Cambia direzione ordinamento">
                            <i class="fas fa-sort-amount-down"></i>
                        </button>
                    </div>
                    <div class="col-lg-2">
                        <button type="button" id="clearFilters" class="btn btn-outline-danger w-100">
                            <i class="fas fa-times me-2"></i>Pulisci
                        </button>
                    </div>
                </div>

                <!-- Results Info -->
                <div class="d-flex justify-content-between align-items-center text-muted">
                    <small id="resultsInfo">
                        <i class="fas fa-info-circle me-1"></i>
                        <span id="visibleCount">0</span> di <span id="totalCount">0</span> prodotti visualizzati
                    </small>
                    <small id="filterStatus"></small>
                </div>
            </div>
        </div>

        <!-- Operations Toolbar -->
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body py-3">
                <div class="row">
                    <!-- Colonna sinistra -->
                    <div class="col-md-6">
                        <div class="mb-2 d-flex flex-wrap align-items-end gap-3">
                            <div>
                                <label class="form-label fw-semibold text-nowrap">
                                    <i class="fas fa-percentage me-2 text-warning"></i>Margine Globale:
                                </label>
                                <div class="input-group">
                                    <input type="number" id="globalMargin" placeholder="%" class="form-control" style="width: 120px;">
                                </div>
                            </div>

                            <div>
                                <label class="form-label fw-semibold text-nowrap">
                                    <i class="fas fa-euro-sign me-2 text-success"></i>Prezzo B2B Globale:
                                </label>
                                <div class="input-group">
                                    <input type="number" id="globalB2BPrice" placeholder="€" class="form-control" style="width: 120px;">
                                </div>
                            </div>

                            <div>
                                <button type="button" id="applyGlobalMargin" class="btn btn-warning">
                                    <i class="fas fa-magic me-2"></i>Applica
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="form-label fw-semibold">
                                <i class="fas fa-users me-2 text-primary"></i>Applica a:
                            </label>
                            <div class="d-flex flex-wrap gap-3">
                                {foreach from=$selected_groups item=group_id}
                                    {foreach from=$groups item=group}
                                        {if $group.id_group == $group_id}
                                            <div class="form-check me-2">
                                                <input class="form-check-input global-margin-group"
                                                       type="checkbox"
                                                       value="{$group.id_group}"
                                                       id="group_{$group.id_group}">
                                                <label class="form-check-label" for="group_{$group.id_group}">
                                                    {$group.name}
                                                </label>
                                            </div>
                                        {/if}
                                    {/foreach}
                                {/foreach}
                                {if $selected_customer}
                                    <div class="form-check me-2">
                                        <input class="form-check-input global-margin-group"
                                               type="checkbox"
                                               value="customer_{$selected_customer}"
                                               id="customer_{$selected_customer}">
                                        <label class="form-check-label" for="customer_{$selected_customer}">
                                            {$customer[0]}
                                        </label>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <!-- Colonna destra -->
                    <div class="col-md-6 text-md-end mt-4 mt-md-0 d-flex justify-content-md-end align-items-start">
                        <button type="button" id="toggleModified" class="btn btn-outline-secondary">
                            <i class="fas fa-eye me-2"></i>Mostra solo modificati
                        </button>
                    </div>
                </div>
            </div>
        </div>


        <!-- Products Table -->
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-light py-3">
                <div class="d-flex align-items-center justify-content-between">
                    <h5 class="card-title mb-0">
                        <i class="fas fa-shopping-cart me-2 text-primary"></i>Listino Prodotti
                    </h5>
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        Scorri orizzontalmente per visualizzare tutte le colonne
                    </small>
                </div>
            </div>
            <div class="card-body p-0">
                <form method="post" id="b2bForm">
                    <input type="hidden" name="reset_specific_price" id="resetSpecificPrice" value="">
                    <input type="hidden" name="resetSpecificGroup" id="resetSpecificGroup" value="">
                    <input type="hidden" name="reset_selection_type" id="resetSelectionType" value="">




                    <input type="hidden" name="id_customer" value="{$selected_customer}">
                    {foreach from=$selected_categories item=cat}
                        <input type="hidden" name="id_categories[]" value="{$cat}">
                    {/foreach}
                    {foreach from=$selected_groups item=group_id}
                        <input type="hidden" name="id_groups[]" value="{$group_id}">
                    {/foreach}
                    {foreach from=$selected_customers item=customer_id}
                        <input type="hidden" name="id_customers[]" value="{$customer_id}">
                    {/foreach}


                    <div class="table-responsive" style="max-height: 600px;">
                        <table class="table table-hover table-striped mb-0">
                            <thead class="table-dark sticky-top">
                            <tr>
                                <th class="text-center" style="width: 50px;">
                                    <div class="form-check">
                                        <input type="checkbox" id="selectAllProducts" class="form-check-input">
                                        <label class="form-check-label" for="selectAllProducts"></label>
                                    </div>
                                </th>
                                <th class="sortable-header" data-sort="id" style="width: 80px; cursor: pointer;">
                                    <i class="fas fa-hashtag me-2"></i>ID
                                    <i class="fas fa-sort sort-icon ms-1"></i>
                                </th>
                                <th class="sortable-header" data-sort="name" style="min-width: 200px; cursor: pointer;">
                                    <i class="fas fa-tag me-2"></i>Nome Prodotto
                                    <i class="fas fa-sort sort-icon ms-1"></i>
                                </th>
                                <th class="sortable-header" data-sort="wholesale_price" style="width: 140px; cursor: pointer;">
                                    <i class="fas fa-shopping-basket me-2"></i>Prezzo Acquisto
                                    <i class="fas fa-sort sort-icon ms-1"></i>
                                </th>
                                <th class="sortable-header" data-sort="price" style="width: 140px; cursor: pointer;">
                                    <i class="fas fa-euro-sign me-2"></i>Prezzo Vendita
                                    <i class="fas fa-sort sort-icon ms-1"></i>
                                </th>


                                {foreach from=$selected_groups item=group_id}
                                    {foreach from=$groups item=group}
                                        {if $group.id_group == $group_id}
                                            <th class="text-center" style="min-width: 160px;">
                                                <i class="fas fa-users me-2"></i>{$group.name}
                                            </th>
                                        {/if}
                                    {/foreach}
                                {/foreach}
                                {if $customer}

                                <th class="text-center" style="min-width: 160px;">
                                    <i class="fas fa-users me-2"></i>{$customer[0]}
                                </th>
                                {/if}


                            </tr>
                            </thead>
                            <tbody>

                            {foreach from=$products item=product}

                                <tr class="product-row"
                                    data-id="{$product.id_product}"
                                    data-name="{$product.name|lower}"
                                    data-wholesale-price="{$product.wholesale_price|floatval}"
                                    data-price="{$product.price|floatval}"
                                    data-b2b-price="{if $product.b2b_price !== null}{$product.b2b_price|floatval}{else}0{/if}"
                                    data-margin="{if $product.b2b_price !== null}{(($product.b2b_price - $product.wholesale_price) / $product.wholesale_price) * 100|number_format:2}{else}0{/if}">
                                    <td class="text-center align-middle">
                                        <div class="form-check">
                                            <input type="checkbox" class="product-checkbox form-check-input"
                                                   data-id="{$product.id_product}"
                                                   id="check_{$product.id_product}">
                                            <label class="form-check-label" for="check_{$product.id_product}"></label>
                                        </div>
                                    </td>
                                    <td class="align-middle">
                                        <span class="badge bg-secondary">{$product.id_product}</span>
                                    </td>
                                    <td class="align-middle">
                                        <div class="p-name fw-semibold">{$product.name}</div>
                                    </td>
                                    <td class="align-middle">
                                        <div class="price-display">
                                            <span class="currency-symbol">€</span>
                                            <span class="price-value">{$product.wholesale_price|number_format:2:'.':','}</span>
                                        </div>
                                    </td>
                                    <td class="align-middle">
                                        <div class="price-display">
                                            <span class="currency-symbol" style="color: #ea5a26">€</span>
                                            <span class="price-value" style="color: #ea5a26">{$product.price|number_format:2:'.':','}</span>

                                        </div>
                                    </td>


                                    {foreach from=$selected_groups item=group_id}

                                        {assign var="group_price_field" value="group_"|cat:$group_id|cat:"_price"}

                                        {capture assign=price_value}{$product[$group_price_field]}{/capture}
                                        <td class="align-middle">
                                            <input type="hidden" name="selection_type" value="group">

                                            <div class="d-flex flex-column align-items-center" style="gap: 5px; min-width: 180px;">

                                                <!-- Margine + % -->
                                                <div style="display: flex; align-items: center;">
                                                    <input type="number"
                                                           class="group-margin-input form-control p-name"
                                                           data-id="{$product.id_product}"
                                                           data-group="{$group_id}"
                                                           data-wholesale="{$product.wholesale_price}"
                                                           value=""
                                                           placeholder="Margine"
                                                           style="flex: 1 1 auto; border-top-right-radius: 0; border-bottom-right-radius: 0;">
                                                    <span style="padding: 0 8px; background: #e9ecef; border: 1px solid #ced4da; border-left: none; border-radius: 0 4px 4px 0; height: 38px; display: flex; align-items: center;">%</span>
                                                </div>

                                                <!-- € + Prezzo -->
                                                <div style="display: flex; align-items: center;">
                                                    <span style="padding: 0 8px; background: #e9ecef; border: 1px solid #ced4da; border-right: none; border-radius: 4px 0 0 4px; height: 32px; display: flex; align-items: center;">€</span>
                                                    <input type="number"
                                                           name="b2b_prices[{$product.id_product}][{$group_id}]"
                                                           class="b2b-price-input form-control p-name"
                                                           data-id="{$product.id_product}"
                                                           data-group="{$group_id}"
                                                           data-wholesale="{$product.wholesale_price}"
                                                           value="{if isset($product["group_"|cat:$group_id|cat:"_price"])}{$product["group_"|cat:$group_id|cat:"_price"]}{else}''{/if}"
                                                           placeholder="Prezzo B2B"
                                                           style="flex: 1 1 auto; border-top-left-radius: 0; border-bottom-left-radius: 0;">
                                                </div>

                                                <!-- Pulsante Rimuovi sistemato -->
                                                {if $price_value != '' && $price_value > 0}
                                                    <div class="text-center mt-1" style="width: 100%;">
                                                        <button type="button"
                                                                class="btn btn-outline-danger btn-sm w-100 reset-specific-price"
                                                                data-product="{$product.id_product}"
                                                                data-type="group"
                                                                data-group="{$group_id}"

                                                            <i class="fas fa-times me-1"></i> Rimuovi
                                                        </button>
                                                    </div>
                                                {/if}

                                            </div>
                                        </td>



                                    {/foreach}
                                    {if $selected_customer}
                                        {assign var="group_price_field" value="customer_"|cat:$selected_customer|cat:"_price"}

                                        {capture assign=price_value_customer}{$product[$group_price_field]}{/capture}
                                        <input type="hidden" name="selection_type" value="customer">
                                        <td class="align-middle">
                                            <div class="d-flex flex-column align-items-center" style="gap: 5px; min-width: 180px;">

                                                <!-- Margine + % -->
                                                <div style="display: flex; align-items: center;">
                                                    <input type="number"
                                                           class="group-margin-input form-control p-name"
                                                           data-id="{$product.id_product}"
                                                           data-group="{$selected_customer}"
                                                           data-wholesale="{$product.wholesale_price}"
                                                           value=""
                                                           placeholder="Margine"
                                                           style="flex: 1 1 auto; border-top-right-radius: 0; border-bottom-right-radius: 0;">
                                                    <span style="padding: 0 8px; background: #e9ecef; border: 1px solid #ced4da; border-left: none; border-radius: 0 4px 4px 0; height: 38px; display: flex; align-items: center;">%</span>
                                                </div>

                                                <!-- € + Prezzo -->
                                                <div style="display: flex; align-items: center;">
                                                    <span style="padding: 0 8px; background: #e9ecef; border: 1px solid #ced4da; border-right: none; border-radius: 4px 0 0 4px; height: 32px; display: flex; align-items: center;">€</span>
                                                    <input type="number"
                                                           name="b2b_prices_customer[{$product.id_product}][{$selected_customer}]"
                                                           class="b2b-price-input form-control p-name"
                                                           data-id="{$product.id_product}"
                                                           data-group="{$selected_customer}"
                                                           data-wholesale="{$product.wholesale_price}"
                                                           value="{if isset($product["customer_"|cat:$selected_customer|cat:"_price"])}{$product["customer_"|cat:$selected_customer|cat:"_price"]}{else}''{/if}"
                                                           placeholder="Prezzo B2B"
                                                           style="flex: 1 1 auto; border-top-left-radius: 0; border-bottom-left-radius: 0;">
                                                </div>

                                                <!-- Bottone Rimuovi -->
                                                {if $price_value_customer != '' && $price_value_customer > 0}
                                                    <div class="text-center mt-1" style="width: 100%;">
                                                        <button type="button"
                                                                class="btn btn-outline-danger btn-sm w-100 reset-specific-price"
                                                                data-type="customer"
                                                                data-product="{$product.id_product}"
                                                                data-group="{$selected_customer}"

                                                            <i class="fas fa-times me-1"></i> Rimuovi
                                                        </button>
                                                    </div>
                                                {/if}

                                            </div>
                                        </td>

                                    {/if}
                            {/foreach}

                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <input type="hidden" name="id_customer" value="{$selected_customer}">
                    <input type="hidden" name="saveAll" id="saveAllHidden" value="0">
                </form>
            </div>
        </div>

        <!-- Save Section -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="d-flex justify-content-end gap-3">

                    <button type="button" id="saveAll" class="btn btn-success btn-lg">
                        <i class="fas fa-save me-2"></i>Applica Prezzi Specifici Gruppo B2B
                    </button>
                </div>
            </div>
        </div>

        <!-- Footer Info -->
        <div class="row mt-5">
            <div class="col-12">
                <div class="text-center text-muted">
                    <small>
                        <i class="fas fa-info-circle me-2"></i>
                        Le modifiche verranno applicate solo dopo aver cliccato "Applica Prezzi Specifici Gruppo B2B"
                    </small>
                </div>
            </div>
        </div>
    {/if}
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>


    <script src="../modules/listino_b2b/views/js/b2b-interactions.js"></script>

</body>
</html>