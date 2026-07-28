import { Modal } from "./modal";
import Button from "./button/Button";
import { TrashBinIcon } from "../../icons";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm m-4">
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/15">
          <TrashBinIcon className="w-7 h-7 text-error-500" />
        </div>
        <h4 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">{title}</h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            className="!bg-error-500 hover:!bg-error-600"
            onClick={onConfirm}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
}