<?php
/**
 * Standalone smoke tests for the WordPress adapter. No WordPress install,
 * database, real user, or external API requests required.
 */
declare(strict_types=1);
define('ABSPATH', '/tmp/wordpress-test/');
$GLOBALS['cmb_test_options'] = [];
function add_action(...$args): void {}
function add_shortcode(...$args): void {}
function get_option($name, $default = false) { return $GLOBALS['cmb_test_options'][$name] ?? $default; }
function wp_parse_args($args, $defaults = []) { return array_merge($defaults, (array) $args); }
function sanitize_text_field($v) { return strip_tags(trim((string) $v)); }
function wp_json_encode($value, $options = 0) { return json_encode($value, $options); }
function esc_url($v) { return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function esc_attr($v) { return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function is_admin(): bool { return false; }
function assert_true($ok, $label): void {
    if (!$ok) { fwrite(STDERR, "FAIL: " . $label . "\n"); exit(1); }
    echo "PASS: " . $label . "\n";
}
require dirname(__DIR__) . '/customer-messaging-bridge.php';
$klass = Customer_Messaging_Bridge::class;
$safe = $klass::sanitize([
    'origin' => 'http://example.invalid:4444/unsafe',
    'workspace_id' => '11755877814459770',
    'webchat_id' => '11755877814902375',
    'brand_color' => '#AA12Ff',
    'enabled' => '1',
    'woo_local_audit' => '1',
]);
assert_true($safe['origin'] === 'https://chatbotx.mad4b.com', 'fixed safe endpoint');
assert_true($safe['brand_color'] === '#aa12ff', 'valid brand color normalized');
assert_true($safe['workspace_id'] === '11755877814459770', 'valid workspace ID');
assert_true($safe['webchat_id'] === '11755877814902375', 'valid webchat ID');
assert_true($safe['enabled'] === '1', 'enabled when explicitly requested');
$bad = $klass::sanitize(['workspace_id' => '42;select 1', 'webchat_id' => '1e3', 'brand_color' => 'red']);
assert_true($bad['workspace_id'] === '' && $bad['webchat_id'] === '', 'invalid IDs discarded');
assert_true($bad['brand_color'] === '#2563eb', 'invalid color rejected');
assert_true(!$klass::ready(), 'absent settings do not bootstrap widget');
$GLOBALS['cmb_test_options'][$klass::OPTION] = $safe;
assert_true($klass::ready(), 'configured settings permit widget bootstrap');
ob_start();
$klass::render_footer();
$klass::render_footer();
$html = ob_get_clean();
assert_true(substr_count($html, '/chat-widget/plugin.js') === 1, 'widget initializes once only');
assert_true(strpos($html, '11755877814902375') !== false, 'webchat resource reference rendered');
assert_true(strpos($html, '11755877814459770') !== false, 'workspace resource reference rendered');
assert_true(strpos($html, 'api_token') === false, 'no credentials exposed to frontend');
echo "ALL STANDALONE TESTS PASSED\n";
