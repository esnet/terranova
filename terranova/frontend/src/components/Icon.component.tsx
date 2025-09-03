// overall, this component is a work-around for lucide's brain-dead tree shaking
import { createElement } from "react";
import {
    AlertTriangle,
    ArrowUpToLine,
    BadgePlus,
    Camera,
    Check,
    CheckSquare,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardCopy,
    Copy,
    Database,
    Eye,
    EyeOff,
    FileEdit,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    GripVertical,
    HelpCircle,
    Hourglass,
    KeyRound,
    Mail,
    Map,
    MapPin,
    Pencil,
    PencilRuler,
    Plus,
    Save,
    Settings,
    Star,
    Trash2,
    UserCircle,
    UserCog,
    X,
    XCircle,
    XSquare,
    Zap,
} from "lucide-react";

interface IconProps {
    name: undefined | string;
    className?: string;
    [otherAttr: string]: any;
}

/**
 * Creates an icon based on Lucide. Defaults to a clipboard copy icon.
 * @param {IconProps} props
 * @returns
 */
export const Icon = (props: IconProps) => {
    let iconClass = null;
    const { name, className, ...rest } = props;
    // the "registry" of icons. In the case that you ask for one that's not in here, should we raise?
    switch (name) {
        case "lucide-alert-triangle":
        case "alert-triangle":
            iconClass = AlertTriangle;
            break;
        case "lucide-arrow-up-to-line":
        case "arrow-up-to-line":
            iconClass = ArrowUpToLine;
            break;
        case "lucide-badge-plus":
        case "badge-plus":
            iconClass = BadgePlus;
            break;
        case "lucide-camera":
        case "camera":
            iconClass = Camera;
            break;
        case "lucide-zap":
        case "zap":
            iconClass = Zap;
            break;
        case "lucide-pencil-ruler":
        case "pencil-ruler":
            iconClass = PencilRuler;
            break;
        case "lucide-folder-open":
        case "folder-open":
            iconClass = FolderOpen;
            break;
        case "lucide-check":
        case "check":
            iconClass = Check;
            break;
        case "lucide-check-square":
        case "check-square":
            iconClass = CheckSquare;
            break;
        case "circle-user":
        case "user-circle":
        case "lucide-circle-user":
            iconClass = UserCircle;
            break;
        case "lucide-chevron-down":
        case "chevron-down":
            iconClass = ChevronDown;
            break;
        case "lucide-chevron-right":
        case "chevron-right":
            iconClass = ChevronRight;
            break;
        case "lucide-chevron-left":
        case "chevron-left":
            iconClass = ChevronLeft;
            break;
        case "lucide-file-text":
        case "file-text":
            iconClass = FileText;
            break;
        case "lucide-file-pen":
        case "file-pen":
        case "file-edit":
        case "lucide-file-edit":
            iconClass = FileEdit;
            break;
        case "file-spreadsheet":
        case "lucide-file-spreadsheet":
            iconClass = FileSpreadsheet;
            break;
        case "lucide-mail":
        case "mail":
            iconClass = Mail;
            break;
        case "lucide-key-round":
        case "key-round":
            iconClass = KeyRound;
            break;
        case "lucide-map":
        case "map":
            iconClass = Map;
            break;
        case "lucide-database":
        case "database":
            iconClass = Database;
            break;
        case "lucide-map-pin":
        case "map-pin":
            iconClass = MapPin;
            break;
        case "lucide-copy":
        case "copy":
            iconClass = Copy;
            break;
        case "lucide-clipboard-copy":
        case "clipboard-copy":
            iconClass = ClipboardCopy;
            break;
        case "lucide-pencil":
        case "pencil":
            iconClass = Pencil;
            break;
        case "lucide-eye":
        case "eye":
            iconClass = Eye;
            break;
        case "lucide-eye-off":
        case "eye-off":
            iconClass = EyeOff;
            break;
        case "lucide-help-circle":
        case "help-circle":
            iconClass = HelpCircle;
            break;
        case "lucide-hourglass":
        case "hourglass":
            iconClass = Hourglass;
            break;
        case "lucide-grip-vertical":
        case "grip-vertical":
            iconClass = GripVertical;
            break;
        case "lucide-save":
        case "save":
            iconClass = Save;
            break;
        case "lucide-settings":
        case "settings":
            iconClass = Settings;
            break;
        case "lucide-star":
        case "star":
            iconClass = Star;
            break;
        case "lucide-trash2":
        case "trash2":
        case "lucide-trash":
        case "trash":
            iconClass = Trash2;
            break;
        case "lucide-user-cog":
        case "user-cog":
            iconClass = UserCog;
            break;
        case "lucide-plus":
        case "plus":
            iconClass = Plus;
            break;
        case "lucide-x-square":
        case "x-square":
            iconClass = XSquare;
            break;
        case "lucide-x-circle":
        case "x-circle":
            iconClass = XCircle;
            break;
        case "lucide-x":
        case "x":
            iconClass = X;
            break;
        default:
            // default if no icon specified: empty span
            return <span></span>;
    }
    // we want all styling done by using classes, not one-offs for each icon. As such, apply classes.
    return createElement(iconClass, { className, ...rest });
};
