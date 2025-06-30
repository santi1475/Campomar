-- CreateTable
CREATE TABLE `auditoria` (
    `AuditoriaID` INTEGER NOT NULL AUTO_INCREMENT,
    `Operacion` VARCHAR(10) NULL,
    `TablaAfectada` VARCHAR(50) NULL,
    `IDAfectado` INTEGER NULL,
    `Fecha` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `Usuario` VARCHAR(50) NULL,

    PRIMARY KEY (`AuditoriaID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empleados` (
    `EmpleadoID` INTEGER NOT NULL AUTO_INCREMENT,
    `Nombre` VARCHAR(100) NULL,
    `TipoEmpleadoID` INTEGER NULL,
    `DNI` CHAR(8) NULL,
    `Password` VARCHAR(255) NULL,

    UNIQUE INDEX `DNI_UNIQUE`(`DNI`),
    INDEX `TipoEmpleadoID`(`TipoEmpleadoID`),
    PRIMARY KEY (`EmpleadoID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `PedidoID` INTEGER NOT NULL AUTO_INCREMENT,
    `EmpleadoID` INTEGER NULL,
    `PlatoID` INTEGER NULL,
    `Cantidad` INTEGER NULL,
    `PrecioTotal` DECIMAL(10, 2) NULL,

    INDEX `idx_EmpleadoID`(`EmpleadoID`),
    INDEX `idx_PlatoID`(`PlatoID`),
    PRIMARY KEY (`PedidoID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platos` (
    `PlatoID` INTEGER NOT NULL AUTO_INCREMENT,
    `Descripcion` VARCHAR(255) NULL,
    `Precio` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`PlatoID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipoempleado` (
    `TipoEmpleadoID` INTEGER NOT NULL AUTO_INCREMENT,
    `Descripcion` VARCHAR(50) NULL,

    PRIMARY KEY (`TipoEmpleadoID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mesas` (
    `MesaID` INTEGER NOT NULL AUTO_INCREMENT,
    `NumeroMesa` INTEGER NOT NULL,
    `Estado` VARCHAR(10) NOT NULL DEFAULT 'Libre',
    `PedidoID` INTEGER NULL,

    INDEX `fk_pedido`(`PedidoID`),
    PRIMARY KEY (`MesaID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `empleados` ADD CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`TipoEmpleadoID`) REFERENCES `tipoempleado`(`TipoEmpleadoID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`EmpleadoID`) REFERENCES `empleados`(`EmpleadoID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`PlatoID`) REFERENCES `platos`(`PlatoID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `mesas` ADD CONSTRAINT `fk_pedido` FOREIGN KEY (`PedidoID`) REFERENCES `pedidos`(`PedidoID`) ON DELETE SET NULL ON UPDATE NO ACTION;