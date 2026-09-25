# dual-legend multilingual keyboards and firmware os input architecture

## executive thesis
bilingual keycaps present dual legends for simultaneous visual reference across two writing systems, or simply put: a physical dual-legend keycap sends a single fixed hardware scancode to the host operating system, which delegates script selection entirely to the active software keyboard layout [evid-dl-001, evid-dl-002, evid-dl-003, evid-dl-004]. while national standards like inscript IS 13194 govern legend positions for indic scripts [evid-dl-009, evid-dl-010] and regional commercial sets serve cyrillic, arabic, and hebrew markets [evid-dl-011, evid-dl-012, evid-dl-013, evid-dl-014], firmware unicode typing options like qmk unicode map or zmk macros act as macro injectors rather than dual live protocol streams [evid-dl-005, evid-dl-006, evid-dl-008]. parametric keycap engines must therefore model dual-legend sets through bound primary-secondary glyph pairs with relative scale ratios and rtl aware corner anchors, rather than uncoupled multi-zone symbol slots.

## 1. the wiring question: physical scancodes vs os input methods
the standard dual-legend keyboard sends exactly one fixed hardware scancode per physical switch press regardless of how many scripts are printed on the keycap surface [evid-dl-002, evid-dl-004]. the host operating system device driver receives this scan code and routes it through the currently active os input source or keyboard layout, which translates the code into a virtual key and character message [evid-dl-001, evid-dl-003]. therefore, dual printing serves as a physical visual map for a user who toggles software layouts in the os, rather than a dual-signal or hardware-switched key.

### os input layer mechanics
- **windows win32 pipeline**: the keyboard driver captures physical make/break scancodes (mapped from usb hid page 0x07 usages) [evid-dl-004] and passes them to the selected input locale dll, where `MapVirtualKey` and active layout tables convert scancodes to virtual keys and unicode character messages [evid-dl-001, evid-dl-002].
- **macos cocoa pipeline**: low-level hardware drivers convert raw keyboard scancodes to virtual keycodes and dispatch them to the cocoa event architecture, where active input sources resolve the keycode to text output based on the selected language layout [evid-dl-003].
- **linux input stack**: kernel evdev receives scancode events and forwards raw keycodes to xkb or libinput, where active keymaps (e.g. setxkbmap or fcitx/ibus input engines) handle character generation.

## 2. print conventions and market scope
national standards and vendor conventions regulate legend positioning, sizing, and contrast for bilingual keycap sets.

### standardized vs vendor print conventions
- **indic scripts (bengali, hindi, marathi, devanagari)**: standardized under the bureau of indian standards (bis) via inscript IS 13194:1991 and enhanced inscript [evid-dl-009, evid-dl-010]. the primary indic script glyph occupies the prominent position (top-left or centered, full size), while standard latin qwerty characters sit in a secondary corner position in a smaller font size.
- **cyrillic (russian, ukrainian, bulgarian)**: standardized around the jcuken layout [evid-dl-014]. commercial sets place latin qwerty primary legends in the top-left corner and cyrillic secondary legends in the bottom-right corner, frequently utilizing distinct legend colors (e.g. red or blue for cyrillic, black or white for latin).
- **rtl scripts (arabic, hebrew, farsi)**: arabic and hebrew bilingual sets maintain consistent corner alignment to prevent legend overlap [evid-dl-011, evid-dl-012, evid-dl-013]. primary latin legends sit top-left, while right-to-left secondary script glyphs anchor to top-right or bottom-right corners.
- **sizing ratios**: primary script legends maintain standard 100% nominal size (typically 3.0mm to 3.5mm height), whereas secondary script legends use a scaled ratio between 60% and 75% (typically 1.8mm to 2.2mm height).

## 3. firmware-level alternatives: unicode input in qmk and zmk
firmware level unicode generation allows a custom keyboard to output non-latin unicode characters directly without requiring the host os to have a dedicated language input method installed.

### qmk firmware unicode engine
qmk provides native unicode character entry through three distinct mechanisms [evid-dl-005]:
- **basic unicode (`UNICODE_ENABLE`)**: stores code points up to `0x7FFF` directly in keymap descriptors using `UC(code_point)` [evid-dl-005].
- **unicode map (`UNICODEMAP_ENABLE`)**: supports the entire unicode spectrum up to `0x10FFFF` via an indexed lookup array (`unicode_map`) accessed by `X(index)` or shift-aware `XP(lower_index, upper_index)` keycodes [evid-dl-005, evid-dl-007].
- **ucis (`UCIS_ENABLE`)**: string-triggered text expansion using mnemonic lookup tables [evid-dl-005].

### os input mode translation and limits
because host operating systems lack a uniform hardware protocol for unicode character reception, qmk translates unicode code points into host-specific key sequence macros based on the active `UNICODE_MODE` setting [evid-dl-006]:
- **`UNICODE_MODE_MACOS`**: toggles left option key hex input, requiring the macos unicode hex input source to be active.
- **`UNICODE_MODE_LINUX`**: sends `Ctrl+Shift+U` unicode sequences recognized by ibus and gtk desktop environments.
- **`UNICODE_MODE_WINCOMPOSE`**: emits compose key sequences for the third-party wincompose application on windows.
- **`UNICODE_MODE_WINDOWS`**: uses alt plus numpad hex sequences, requiring the windows `EnableHexNumpad` registry key setting.

### zmk firmware status
core zmk lacks a built-in unicode mapping table equal to qmk. users rely on custom C macros or community modules like `urob/zmk-unicode` to synthesize os-specific unicode key combinations [evid-dl-008].

## 4. caps engine schema proposal for dual-legend keycaps
the multi-zone sub-legend schema proposed in `research/legends-multilingual.md` models uncoupled symbol slots (e.g. media hotkeys or secondary layer symbols). dual-legend bilingual keycaps require an explicit paired binding schema that ties a primary script character to a secondary script character with relative scale and position rules.

### proposed schema fields for dual-legend sets
- `dual_script_pair`: object `{ "primary_script": string, "secondary_script": string }` - explicitly links primary script (e.g. "bengali") and secondary script (e.g. "latin").
- `secondary_font_size_ratio`: number (e.g. `0.65`) - defines the font height of the secondary legend as a fraction of the primary legend font height.
- `secondary_anchor_point`: enum (`top_left`, `top_right`, `bottom_left`, `bottom_right`, `center`) - specifies the secondary legend origin relative to the primary legend position.
- `rtl_alignment_flip`: boolean (e.g. `true` for arabic, hebrew, farsi) - automatically flips horizontal legend margins and text alignments for right-to-left secondary scripts.
- `legend_color_secondary`: string (hex or color code) - supports contrasting legend dye colors for secondary script legends (e.g. red Cyrillic sublegends on black keycaps).
- `active_os_layout_target`: string (e.g. "inscript_bengali", "ru_jcuken", "arabic_101") - metadata linking physical secondary legends to corresponding os keyboard layout profiles.

## open questions
1. how do custom keycap manufacturers handle legends when a primary script character requires multi-line stacked ligatures in narrow keycap top bounding boxes?
2. what is the exact reliability impact on bluetooth hid throughput when qmk or zmk unicode modes burst multi-keystroke alt-hex or ibus macro sequences over wireless connections?
3. will future usb hid standards introduce direct unicode character payload reports to eliminate host-side input mode dependencies?
