# connmon

## v3.0.4
### Updated on 2025-May-29
## About
connmon is an internet connection monitoring tool for AsusWRT Merlin with charts for daily, weekly and monthly summaries.

connmon is free to use under the [GNU General Public License version 3](https://opensource.org/licenses/GPL-3.0) (GPL 3.0).

## Supported firmware versions
You must be running firmware Merlin 384.15/384.13_4 or Fork 43E5 (or later) [Asuswrt-Merlin](https://www.asuswrt-merlin.net/)

## Installation
Using your preferred SSH client/terminal, copy and paste the following command, then press Enter:
```sh
/usr/sbin/curl -fsL --retry 3 "https://raw.githubusercontent.com/AMTM-OSR/connmon/master/connmon.sh" -o "/jffs/scripts/connmon" && chmod 0755 /jffs/scripts/connmon && /jffs/scripts/connmon install
```

## Usage
### WebUI
connmon can be configured via the WebUI, in the Addons section.

### Command Line
To launch the connmon menu after installation, use:
```sh
connmon
```

If this does not work, you will need to use the full path:
```sh
/jffs/scripts/connmon
```

## Screenshots
![WebUI1](https://puu.sh/I7cBZ/30524b48ae.png)

![WebUI2](https://puu.sh/I7cC0/3433cf06f7.png)

![WebUI3](https://puu.sh/I7cBY/6affedcc64.png)

![WebUI4](https://puu.sh/I7cBX/7f2d2e0ec5.png)

![CLI UI](https://puu.sh/I7cBV/62329495d3.png)

## Help
Please post about any issues and problems here: [Asuswrt-Merlin AddOns on SNBForums](https://www.snbforums.com/forums/asuswrt-merlin-addons.60/?prefix_id=18)

### Scarf Gateway
Installs and updates for this addon are redirected via the [Scarf Gateway](https://about.scarf.sh/scarf-gateway) by [Scarf](https://about.scarf.sh/about). This allows me to gather data on the number of new installations of my addons, how often users check for updates and more. This is purely for my use to actually see some usage data from my addons so that I can see the value provided by my continued work. It does not mean I am going to start charging to use my addons. My addons have been, are, and will always be completely free to use.

Please refer to Scarf's [Privacy Policy](https://about.scarf.sh/privacy) for more information about the data that is collected and how it is processed.
