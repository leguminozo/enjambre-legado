export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          severity: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          severity: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      apiarios: {
        Row: {
          created_at: string | null
          details: string | null
          health: string | null
          id: string
          lat: number
          lng: number
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          health?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          health?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      arboles_plantados: {
        Row: {
          cantidad: number
          co2_ton: number | null
          created_at: string | null
          especie: string
          fecha: string | null
          id: string
          lat: number | null
          lng: number | null
          sector: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          cantidad: number
          co2_ton?: number | null
          created_at?: string | null
          especie: string
          fecha?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          sector?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          cantidad?: number
          co2_ton?: number | null
          created_at?: string | null
          especie?: string
          fecha?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          sector?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banco_chile_conciliaciones: {
        Row: {
          concepto: string | null
          confianza: number | null
          created_at: string
          fecha_conciliacion: string
          fecha_propuesta: string | null
          gasto_id: string | null
          id: string
          monto: number
          movimiento_id: string
          regla_id: string | null
          tipo_conciliacion: string | null
          venta_id: string | null
        }
        Insert: {
          concepto?: string | null
          confianza?: number | null
          created_at?: string
          fecha_conciliacion?: string
          fecha_propuesta?: string | null
          gasto_id?: string | null
          id?: string
          monto: number
          movimiento_id: string
          regla_id?: string | null
          tipo_conciliacion?: string | null
          venta_id?: string | null
        }
        Update: {
          concepto?: string | null
          confianza?: number | null
          created_at?: string
          fecha_conciliacion?: string
          fecha_propuesta?: string | null
          gasto_id?: string | null
          id?: string
          monto?: number
          movimiento_id?: string
          regla_id?: string | null
          tipo_conciliacion?: string | null
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_conciliaciones_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_chile_conciliaciones_movimiento_id_fkey"
            columns: ["movimiento_id"]
            isOneToOne: false
            referencedRelation: "banco_chile_movimientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_chile_conciliaciones_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_config: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          empresa_id: string
          enabled: boolean
          environment: string
          id: string
          last_sync: string | null
          password: string
          updated_at: string
          username: string
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string
          empresa_id: string
          enabled?: boolean
          environment?: string
          id?: string
          last_sync?: string | null
          password: string
          updated_at?: string
          username: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          empresa_id?: string
          enabled?: boolean
          environment?: string
          id?: string
          last_sync?: string | null
          password?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_cotizaciones: {
        Row: {
          afp: string
          created_at: string
          empresa_id: string
          horas_trabajadas: number | null
          id: string
          isapre: string | null
          monto_afp: number | null
          monto_isapre: number | null
          nombre_trabajador: string
          periodo: string
          rut_trabajador: string
          seguro_cecesantia: number | null
          sueldo_base: number
          tramo_afp: string | null
          tramo_isapre: string | null
          updated_at: string
        }
        Insert: {
          afp: string
          created_at?: string
          empresa_id: string
          horas_trabajadas?: number | null
          id?: string
          isapre?: string | null
          monto_afp?: number | null
          monto_isapre?: number | null
          nombre_trabajador: string
          periodo: string
          rut_trabajador: string
          seguro_cecesantia?: number | null
          sueldo_base: number
          tramo_afp?: string | null
          tramo_isapre?: string | null
          updated_at?: string
        }
        Update: {
          afp?: string
          created_at?: string
          empresa_id?: string
          horas_trabajadas?: number | null
          id?: string
          isapre?: string | null
          monto_afp?: number | null
          monto_isapre?: number | null
          nombre_trabajador?: string
          periodo?: string
          rut_trabajador?: string
          seguro_cecesantia?: number | null
          sueldo_base?: number
          tramo_afp?: string | null
          tramo_isapre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_cotizaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_cuentas: {
        Row: {
          activa: boolean
          config_id: string
          created_at: string
          empresa_id: string
          id: string
          moneda: string
          numero_cuenta: string
          saldo_contable: number
          saldo_disponible: number
          tipo_cuenta: string
          ultimo_movimiento: string | null
          updated_at: string
        }
        Insert: {
          activa?: boolean
          config_id: string
          created_at?: string
          empresa_id: string
          id?: string
          moneda?: string
          numero_cuenta: string
          saldo_contable?: number
          saldo_disponible?: number
          tipo_cuenta: string
          ultimo_movimiento?: string | null
          updated_at?: string
        }
        Update: {
          activa?: boolean
          config_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          moneda?: string
          numero_cuenta?: string
          saldo_contable?: number
          saldo_disponible?: number
          tipo_cuenta?: string
          ultimo_movimiento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_cuentas_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "banco_chile_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_chile_cuentas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_documentos: {
        Row: {
          config_id: string
          created_at: string
          empresa_id: string
          estado: string
          fecha_emision: string | null
          fecha_vencimiento: string
          id: string
          monto_nominal: number
          monto_pagar: number | null
          nombre_librador: string
          nombre_libratario: string | null
          numero_documento: string
          observaciones: string | null
          rut_librador: string
          rut_libratario: string | null
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          config_id: string
          created_at?: string
          empresa_id: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento: string
          id?: string
          monto_nominal: number
          monto_pagar?: number | null
          nombre_librador: string
          nombre_libratario?: string | null
          numero_documento: string
          observaciones?: string | null
          rut_librador: string
          rut_libratario?: string | null
          tipo_documento: string
          updated_at?: string
        }
        Update: {
          config_id?: string
          created_at?: string
          empresa_id?: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string
          id?: string
          monto_nominal?: number
          monto_pagar?: number | null
          nombre_librador?: string
          nombre_libratario?: string | null
          numero_documento?: string
          observaciones?: string | null
          rut_librador?: string
          rut_libratario?: string | null
          tipo_documento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_documentos_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "banco_chile_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_chile_documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_montos_preaprobados: {
        Row: {
          condiciones: string | null
          created_at: string
          empresa_id: string
          fecha_aprobacion: string
          fecha_vencimiento: string
          id: string
          monto_disponible: number
          monto_preaprobado: number
          nombre_cliente: string
          producto: string | null
          rut_cliente: string
          tasa_interes: number | null
          updated_at: string
        }
        Insert: {
          condiciones?: string | null
          created_at?: string
          empresa_id: string
          fecha_aprobacion: string
          fecha_vencimiento: string
          id?: string
          monto_disponible: number
          monto_preaprobado: number
          nombre_cliente: string
          producto?: string | null
          rut_cliente: string
          tasa_interes?: number | null
          updated_at?: string
        }
        Update: {
          condiciones?: string | null
          created_at?: string
          empresa_id?: string
          fecha_aprobacion?: string
          fecha_vencimiento?: string
          id?: string
          monto_disponible?: number
          monto_preaprobado?: number
          nombre_cliente?: string
          producto?: string | null
          rut_cliente?: string
          tasa_interes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_montos_preaprobados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_movimientos: {
        Row: {
          banco_contraparte: string | null
          categoria: string | null
          conciliacion_id: string | null
          conciliado: boolean
          created_at: string
          cuenta_id: string
          descripcion: string
          descripcion_detallada: string | null
          empresa_id: string
          fecha_contable: string
          fecha_valor: string
          id: string
          moneda: string
          monto: number
          nombre_contraparte: string | null
          numero_operacion: string | null
          referencia: string | null
          rut_contraparte: string | null
          saldo_posterior: number | null
          subcategoria: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          banco_contraparte?: string | null
          categoria?: string | null
          conciliacion_id?: string | null
          conciliado?: boolean
          created_at?: string
          cuenta_id: string
          descripcion: string
          descripcion_detallada?: string | null
          empresa_id: string
          fecha_contable: string
          fecha_valor: string
          id?: string
          moneda?: string
          monto: number
          nombre_contraparte?: string | null
          numero_operacion?: string | null
          referencia?: string | null
          rut_contraparte?: string | null
          saldo_posterior?: number | null
          subcategoria?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          banco_contraparte?: string | null
          categoria?: string | null
          conciliacion_id?: string | null
          conciliado?: boolean
          created_at?: string
          cuenta_id?: string
          descripcion?: string
          descripcion_detallada?: string | null
          empresa_id?: string
          fecha_contable?: string
          fecha_valor?: string
          id?: string
          moneda?: string
          monto?: number
          nombre_contraparte?: string | null
          numero_operacion?: string | null
          referencia?: string | null
          rut_contraparte?: string | null
          saldo_posterior?: number | null
          subcategoria?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_movimientos_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "banco_chile_cuentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_chile_movimientos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_nomina_detalles: {
        Row: {
          banco: string
          concepto: string | null
          created_at: string
          estado: string
          id: string
          monto: number
          nombre_beneficiario: string
          nomina_id: string
          numero_cuenta: string
          rut_beneficiario: string
          tipo_cuenta: string
        }
        Insert: {
          banco: string
          concepto?: string | null
          created_at?: string
          estado?: string
          id?: string
          monto: number
          nombre_beneficiario: string
          nomina_id: string
          numero_cuenta: string
          rut_beneficiario: string
          tipo_cuenta: string
        }
        Update: {
          banco?: string
          concepto?: string | null
          created_at?: string
          estado?: string
          id?: string
          monto?: number
          nombre_beneficiario?: string
          nomina_id?: string
          numero_cuenta?: string
          rut_beneficiario?: string
          tipo_cuenta?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_nomina_detalles_nomina_id_fkey"
            columns: ["nomina_id"]
            isOneToOne: false
            referencedRelation: "banco_chile_nominas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_nominas: {
        Row: {
          archivo_texto: string | null
          comprobante: string | null
          config_id: string
          created_at: string
          empresa_id: string
          estado: string
          id: string
          numero_nomina: string
          periodo: string
          total_nominas: number
          updated_at: string
        }
        Insert: {
          archivo_texto?: string | null
          comprobante?: string | null
          config_id: string
          created_at?: string
          empresa_id: string
          estado?: string
          id?: string
          numero_nomina: string
          periodo: string
          total_nominas: number
          updated_at?: string
        }
        Update: {
          archivo_texto?: string | null
          comprobante?: string | null
          config_id?: string
          created_at?: string
          empresa_id?: string
          estado?: string
          id?: string
          numero_nomina?: string
          periodo?: string
          total_nominas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_nominas_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "banco_chile_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_chile_nominas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_notificaciones: {
        Row: {
          created_at: string
          cuenta_afectada: string | null
          datos_raw: Json | null
          descripcion: string | null
          empresa_id: string
          id: string
          monto: number | null
          procesado: boolean
          tipo_evento: string
        }
        Insert: {
          created_at?: string
          cuenta_afectada?: string | null
          datos_raw?: Json | null
          descripcion?: string | null
          empresa_id: string
          id?: string
          monto?: number | null
          procesado?: boolean
          tipo_evento: string
        }
        Update: {
          created_at?: string
          cuenta_afectada?: string | null
          datos_raw?: Json | null
          descripcion?: string | null
          empresa_id?: string
          id?: string
          monto?: number | null
          procesado?: boolean
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_notificaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_rentas: {
        Row: {
          confianza: string
          created_at: string
          empresa_id: string
          fuente: string
          id: string
          ingresos_no_renta: number | null
          nombre_persona: string
          periodo: string
          renta_bruta: number
          renta_liquida: number
          rut_persona: string
          updated_at: string
        }
        Insert: {
          confianza?: string
          created_at?: string
          empresa_id: string
          fuente?: string
          id?: string
          ingresos_no_renta?: number | null
          nombre_persona: string
          periodo: string
          renta_bruta: number
          renta_liquida: number
          rut_persona: string
          updated_at?: string
        }
        Update: {
          confianza?: string
          created_at?: string
          empresa_id?: string
          fuente?: string
          id?: string
          ingresos_no_renta?: number | null
          nombre_persona?: string
          periodo?: string
          renta_bruta?: number
          renta_liquida?: number
          rut_persona?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_rentas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_tokens: {
        Row: {
          access_token: string
          config_id: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string | null
          token_type: string
          updated_at: string
        }
        Insert: {
          access_token: string
          config_id: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          token_type?: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          config_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          token_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_tokens_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "banco_chile_config"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_chile_transferencias: {
        Row: {
          banco_destino: string
          comprobante: string | null
          concepto: string | null
          config_id: string
          created_at: string
          cuenta_destino: string
          cuenta_origen: string
          empresa_id: string
          estado: string
          id: string
          monto: number
          nombre_destinatario: string
          numero_operacion: string | null
          rut_destinatario: string
          tipo_transferencia: string
          updated_at: string
        }
        Insert: {
          banco_destino: string
          comprobante?: string | null
          concepto?: string | null
          config_id: string
          created_at?: string
          cuenta_destino: string
          cuenta_origen: string
          empresa_id: string
          estado?: string
          id?: string
          monto: number
          nombre_destinatario: string
          numero_operacion?: string | null
          rut_destinatario: string
          tipo_transferencia?: string
          updated_at?: string
        }
        Update: {
          banco_destino?: string
          comprobante?: string | null
          concepto?: string | null
          config_id?: string
          created_at?: string
          cuenta_destino?: string
          cuenta_origen?: string
          empresa_id?: string
          estado?: string
          id?: string
          monto?: number
          nombre_destinatario?: string
          numero_operacion?: string | null
          rut_destinatario?: string
          tipo_transferencia?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_chile_transferencias_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "banco_chile_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banco_chile_transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_movements: {
        Row: {
          conciliado: boolean | null
          created_at: string
          descripcion: string | null
          id: string
          moneda: string | null
          monto: number | null
          movimiento_fecha: string | null
          raw: Json
          referencia: string | null
          source_file_id: string | null
          tipo: string | null
          venta_id: string | null
        }
        Insert: {
          conciliado?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          moneda?: string | null
          monto?: number | null
          movimiento_fecha?: string | null
          raw?: Json
          referencia?: string | null
          source_file_id?: string | null
          tipo?: string | null
          venta_id?: string | null
        }
        Update: {
          conciliado?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          moneda?: string | null
          monto?: number | null
          movimiento_fecha?: string | null
          raw?: Json
          referencia?: string | null
          source_file_id?: string | null
          tipo?: string | null
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_movements_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "source_files"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_anchors: {
        Row: {
          block_number: number | null
          block_timestamp: string | null
          chain: string
          created_at: string
          empresa_id: string | null
          entity_id: string
          entity_type: string
          id: string
          merkle_proof: Json
          metadata: Json
          tx_hash: string
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: string | null
          chain?: string
          created_at?: string
          empresa_id?: string | null
          entity_id: string
          entity_type: string
          id?: string
          merkle_proof?: Json
          metadata?: Json
          tx_hash: string
        }
        Update: {
          block_number?: number | null
          block_timestamp?: string | null
          chain?: string
          created_at?: string
          empresa_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          merkle_proof?: Json
          metadata?: Json
          tx_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_anchors_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      boletas_ingest: {
        Row: {
          created_at: string
          emision_fecha: string | null
          estado: string | null
          folio: string | null
          id: string
          monto_iva: number | null
          monto_neto: number | null
          monto_total: number | null
          raw: Json
          razon_social: string | null
          rut_receptor: string | null
          source_file_id: string | null
        }
        Insert: {
          created_at?: string
          emision_fecha?: string | null
          estado?: string | null
          folio?: string | null
          id?: string
          monto_iva?: number | null
          monto_neto?: number | null
          monto_total?: number | null
          raw?: Json
          razon_social?: string | null
          rut_receptor?: string | null
          source_file_id?: string | null
        }
        Update: {
          created_at?: string
          emision_fecha?: string | null
          estado?: string | null
          folio?: string | null
          id?: string
          monto_iva?: number | null
          monto_neto?: number | null
          monto_total?: number | null
          raw?: Json
          razon_social?: string | null
          rut_receptor?: string | null
          source_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boletas_ingest_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "source_files"
            referencedColumns: ["id"]
          },
        ]
      }
      calculos_ia: {
        Row: {
          confianza: number | null
          created_at: string
          empresa_id: string
          error: string | null
          estado: string
          id: string
          parametros: Json
          prompt: string | null
          respuesta_ia: string | null
          resultado: Json
          tipo: string
          updated_at: string
        }
        Insert: {
          confianza?: number | null
          created_at?: string
          empresa_id: string
          error?: string | null
          estado?: string
          id?: string
          parametros?: Json
          prompt?: string | null
          respuesta_ia?: string | null
          resultado?: Json
          tipo: string
          updated_at?: string
        }
        Update: {
          confianza?: number | null
          created_at?: string
          empresa_id?: string
          error?: string | null
          estado?: string
          id?: string
          parametros?: Json
          prompt?: string | null
          respuesta_ia?: string | null
          resultado?: Json
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calculos_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      calendario_tasks: {
        Row: {
          category: string
          colmena: string | null
          created_at: string | null
          done: boolean | null
          id: string
          month: string
          notes: string | null
          priority: string | null
          title: string
          user_id: string | null
          week: number
        }
        Insert: {
          category: string
          colmena?: string | null
          created_at?: string | null
          done?: boolean | null
          id?: string
          month: string
          notes?: string | null
          priority?: string | null
          title: string
          user_id?: string | null
          week: number
        }
        Update: {
          category?: string
          colmena?: string | null
          created_at?: string | null
          done?: boolean | null
          id?: string
          month?: string
          notes?: string | null
          priority?: string | null
          title?: string
          user_id?: string | null
          week?: number
        }
        Relationships: []
      }
      canjes_recompensas: {
        Row: {
          codigo_canje: string | null
          created_at: string
          empresa_id: string | null
          estado: string
          fecha_canje: string
          fecha_expiracion: string | null
          id: string
          metadata: Json | null
          puntos_usados: number
          recompensa_id: string | null
          user_id: string | null
        }
        Insert: {
          codigo_canje?: string | null
          created_at?: string
          empresa_id?: string | null
          estado?: string
          fecha_canje?: string
          fecha_expiracion?: string | null
          id?: string
          metadata?: Json | null
          puntos_usados: number
          recompensa_id?: string | null
          user_id?: string | null
        }
        Update: {
          codigo_canje?: string | null
          created_at?: string
          empresa_id?: string | null
          estado?: string
          fecha_canje?: string
          fecha_expiracion?: string | null
          id?: string
          metadata?: Json | null
          puntos_usados?: number
          recompensa_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canjes_recompensas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_recompensas_recompensa_id_fkey"
            columns: ["recompensa_id"]
            isOneToOne: false
            referencedRelation: "recompensas_fidelizacion"
            referencedColumns: ["id"]
          },
        ]
      }
      carrito_items: {
        Row: {
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrito_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrito_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrito_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "carrito_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cart_abandonment_events: {
        Row: {
          cart_items: Json
          cart_total: number | null
          converted: boolean | null
          created_at: string | null
          email: string | null
          email_sent_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          cart_items?: Json
          cart_total?: number | null
          converted?: boolean | null
          created_at?: string | null
          email?: string | null
          email_sent_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          cart_items?: Json
          cart_total?: number | null
          converted?: boolean | null
          created_at?: string | null
          email?: string | null
          email_sent_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_abandonment_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_abandonment_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cart_abandonment_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          cash_difference: number | null
          closed_at: string | null
          closing_cash_counted: number | null
          closing_cash_expected: number | null
          created_at: string
          empresa_id: string
          id: string
          notas: string | null
          opened_at: string
          opening_cash: number
          reconciled_at: string | null
          reconciled_by: string | null
          rep_id: string
          session_status: string
        }
        Insert: {
          cash_difference?: number | null
          closed_at?: string | null
          closing_cash_counted?: number | null
          closing_cash_expected?: number | null
          created_at?: string
          empresa_id: string
          id?: string
          notas?: string | null
          opened_at?: string
          opening_cash?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          rep_id: string
          session_status?: string
        }
        Update: {
          cash_difference?: number | null
          closed_at?: string | null
          closing_cash_counted?: number | null
          closing_cash_expected?: number | null
          created_at?: string
          empresa_id?: string
          id?: string
          notas?: string | null
          opened_at?: string
          opening_cash?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          rep_id?: string
          session_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow: {
        Row: {
          created_at: string | null
          expenses: number | null
          id: string
          income: number | null
          month: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expenses?: number | null
          id?: string
          income?: number | null
          month: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expenses?: number | null
          id?: string
          income?: number | null
          month?: string
          user_id?: string | null
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          buy_order: string
          buyer_mode: string
          cart: Json
          cliente_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          organizacion_id: string | null
          provider: string
          session_id: string
          shipping: Json | null
          status: string
          total: number
        }
        Insert: {
          buy_order: string
          buyer_mode?: string
          cart: Json
          cliente_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          organizacion_id?: string | null
          provider: string
          session_id: string
          shipping?: Json | null
          status?: string
          total: number
        }
        Update: {
          buy_order?: string
          buyer_mode?: string
          cart?: Json
          cliente_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          organizacion_id?: string | null
          provider?: string
          session_id?: string
          shipping?: Json | null
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "checkout_sessions_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ciclos: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          referencia_id: string | null
          referencia_tabla: string | null
          tipo: Database["public"]["Enums"]["accion_tipo"]
          user_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          id?: string
          referencia_id?: string | null
          referencia_tabla?: string | null
          tipo: Database["public"]["Enums"]["accion_tipo"]
          user_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          referencia_id?: string | null
          referencia_tabla?: string | null
          tipo?: Database["public"]["Enums"]["accion_tipo"]
          user_id?: string
        }
        Relationships: []
      }
      ciclos_canjeados: {
        Row: {
          beneficio_tipo: string
          ciclos_usados: number
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          beneficio_tipo: string
          ciclos_usados: number
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          beneficio_tipo?: string
          ciclos_usados?: number
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      cliente_direcciones: {
        Row: {
          ciudad: string
          codigo_postal: string | null
          comuna: string
          created_at: string
          direccion: string
          es_predeterminada: boolean
          etiqueta: string
          id: string
          instrucciones: string | null
          nombre: string
          pais: string
          region: string
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciudad: string
          codigo_postal?: string | null
          comuna: string
          created_at?: string
          direccion: string
          es_predeterminada?: boolean
          etiqueta?: string
          id?: string
          instrucciones?: string | null
          nombre: string
          pais?: string
          region: string
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciudad?: string
          codigo_postal?: string | null
          comuna?: string
          created_at?: string
          direccion?: string
          es_predeterminada?: boolean
          etiqueta?: string
          id?: string
          instrucciones?: string | null
          nombre?: string
          pais?: string
          region?: string
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_direcciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_direcciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cliente_direcciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string | null
          id: string
          last_purchase: string | null
          name: string
          notes: string | null
          status: string | null
          total_spent: number | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          last_purchase?: string | null
          name: string
          notes?: string | null
          status?: string | null
          total_spent?: number | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_purchase?: string | null
          name?: string
          notes?: string | null
          status?: string | null
          total_spent?: number | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      co2_capture_metrics: {
        Row: {
          arbol_id: string | null
          co2_kg_capturado: number
          created_at: string | null
          edad_anos: number | null
          factor_especie: number | null
          fecha_medicion: string
          id: string
          metodo_medicion: string | null
          verified: boolean | null
        }
        Insert: {
          arbol_id?: string | null
          co2_kg_capturado: number
          created_at?: string | null
          edad_anos?: number | null
          factor_especie?: number | null
          fecha_medicion?: string
          id?: string
          metodo_medicion?: string | null
          verified?: boolean | null
        }
        Update: {
          arbol_id?: string | null
          co2_kg_capturado?: number
          created_at?: string | null
          edad_anos?: number | null
          factor_especie?: number | null
          fecha_medicion?: string
          id?: string
          metodo_medicion?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "co2_capture_metrics_arbol_id_fkey"
            columns: ["arbol_id"]
            isOneToOne: false
            referencedRelation: "arboles_plantados"
            referencedColumns: ["id"]
          },
        ]
      }
      colmenas: {
        Row: {
          alzas: number | null
          apiario_id: string | null
          blockchain_hash: string | null
          created_at: string | null
          floracion: string | null
          health: string | null
          id: string
          last_inspection: string | null
          lote_activo: string | null
          name: string
          notes: string | null
          nucleos_candidatos: boolean | null
          production_total: number | null
          queen: string | null
          user_id: string | null
        }
        Insert: {
          alzas?: number | null
          apiario_id?: string | null
          blockchain_hash?: string | null
          created_at?: string | null
          floracion?: string | null
          health?: string | null
          id?: string
          last_inspection?: string | null
          lote_activo?: string | null
          name: string
          notes?: string | null
          nucleos_candidatos?: boolean | null
          production_total?: number | null
          queen?: string | null
          user_id?: string | null
        }
        Update: {
          alzas?: number | null
          apiario_id?: string | null
          blockchain_hash?: string | null
          created_at?: string | null
          floracion?: string | null
          health?: string | null
          id?: string
          last_inspection?: string | null
          lote_activo?: string | null
          name?: string
          notes?: string | null
          nucleos_candidatos?: boolean | null
          production_total?: number | null
          queen?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colmenas_apiario_id_fkey"
            columns: ["apiario_id"]
            isOneToOne: false
            referencedRelation: "apiarios"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_records: {
        Row: {
          base_commission: number
          calculated_at: string
          channel_rate: number | null
          created_at: string
          empresa_id: string
          id: string
          loyalty_bonus: number
          paid: boolean
          paid_at: string | null
          paid_by: string | null
          rep_id: string
          session_id: string
          streak_bonus: number
          tier_multiplier: number
          total_commission: number
          venta_id: string | null
          volume_multiplier: number
        }
        Insert: {
          base_commission?: number
          calculated_at?: string
          channel_rate?: number | null
          created_at?: string
          empresa_id: string
          id?: string
          loyalty_bonus?: number
          paid?: boolean
          paid_at?: string | null
          paid_by?: string | null
          rep_id: string
          session_id: string
          streak_bonus?: number
          tier_multiplier?: number
          total_commission?: number
          venta_id?: string | null
          volume_multiplier?: number
        }
        Update: {
          base_commission?: number
          calculated_at?: string
          channel_rate?: number | null
          created_at?: string
          empresa_id?: string
          id?: string
          loyalty_bonus?: number
          paid?: boolean
          paid_at?: string | null
          paid_by?: string | null
          rep_id?: string
          session_id?: string
          streak_bonus?: number
          tier_multiplier?: number
          total_commission?: number
          venta_id?: string | null
          volume_multiplier?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_records_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rep_session_summary_view"
            referencedColumns: ["session_id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          active: boolean
          created_at: string
          empresa_id: string
          id: string
          name: string
          parameter: Json
          priority: number
          rule_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          name: string
          parameter?: Json
          priority?: number
          rule_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          name?: string
          parameter?: Json
          priority?: number
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliaciones: {
        Row: {
          conciliado_at: string
          conciliado_por: string | null
          created_at: string
          diferencia: number
          empresa_id: string
          estado: string
          factura_compra_id: string | null
          gasto_extranjero_id: string | null
          id: string
          monto_documento: number | null
          monto_movimiento: number | null
          movimiento_id: string | null
          tipo: string
          venta_id: string | null
        }
        Insert: {
          conciliado_at?: string
          conciliado_por?: string | null
          created_at?: string
          diferencia?: number
          empresa_id: string
          estado?: string
          factura_compra_id?: string | null
          gasto_extranjero_id?: string | null
          id?: string
          monto_documento?: number | null
          monto_movimiento?: number | null
          movimiento_id?: string | null
          tipo: string
          venta_id?: string | null
        }
        Update: {
          conciliado_at?: string
          conciliado_por?: string | null
          created_at?: string
          diferencia?: number
          empresa_id?: string
          estado?: string
          factura_compra_id?: string | null
          gasto_extranjero_id?: string | null
          id?: string
          monto_documento?: number | null
          monto_movimiento?: number | null
          movimiento_id?: string | null
          tipo?: string
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conciliaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliaciones_factura_compra_id_fkey"
            columns: ["factura_compra_id"]
            isOneToOne: false
            referencedRelation: "facturas_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliaciones_gasto_extranjero_id_fkey"
            columns: ["gasto_extranjero_id"]
            isOneToOne: false
            referencedRelation: "gastos_extranjeros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliaciones_movimiento_id_fkey"
            columns: ["movimiento_id"]
            isOneToOne: false
            referencedRelation: "banco_chile_movimientos"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliaciones_sumup: {
        Row: {
          checkout_id: string | null
          comision: number
          created_at: string
          empresa_id: string
          estado: string
          factura_id: string | null
          id: string
          monto: number
          neto: number
          observaciones: string | null
          tipo: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          checkout_id?: string | null
          comision?: number
          created_at?: string
          empresa_id: string
          estado?: string
          factura_id?: string | null
          id?: string
          monto: number
          neto: number
          observaciones?: string | null
          tipo?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          checkout_id?: string | null
          comision?: number
          created_at?: string
          empresa_id?: string
          estado?: string
          factura_id?: string | null
          id?: string
          monto?: number
          neto?: number
          observaciones?: string | null
          tipo?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conciliaciones_sumup_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliaciones_sumup_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas_emitidas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_ia: {
        Row: {
          clave: string
          created_at: string
          descripcion: string | null
          id: string
          tipo: string
          updated_at: string
          valor: string
        }
        Insert: {
          clave: string
          created_at?: string
          descripcion?: string | null
          id?: string
          tipo?: string
          updated_at?: string
          valor: string
        }
        Update: {
          clave?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          tipo?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      cosechas: {
        Row: {
          colmena_id: string | null
          created_at: string | null
          fecha: string | null
          floracion: string | null
          id: string
          kg: number | null
          lote_id: string | null
        }
        Insert: {
          colmena_id?: string | null
          created_at?: string | null
          fecha?: string | null
          floracion?: string | null
          id?: string
          kg?: number | null
          lote_id?: string | null
        }
        Update: {
          colmena_id?: string | null
          created_at?: string | null
          fecha?: string | null
          floracion?: string | null
          id?: string
          kg?: number | null
          lote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosechas_colmena_id_fkey"
            columns: ["colmena_id"]
            isOneToOne: false
            referencedRelation: "colmenas"
            referencedColumns: ["id"]
          },
        ]
      }
      costos_colmena: {
        Row: {
          amortizacion_cajon: number | null
          colmena_id: string | null
          costo_hora: number | null
          created_at: string | null
          horas_anuales: number | null
          id: string
          insumos_anuales: number | null
          produccion_kg: number | null
        }
        Insert: {
          amortizacion_cajon?: number | null
          colmena_id?: string | null
          costo_hora?: number | null
          created_at?: string | null
          horas_anuales?: number | null
          id?: string
          insumos_anuales?: number | null
          produccion_kg?: number | null
        }
        Update: {
          amortizacion_cajon?: number | null
          colmena_id?: string | null
          costo_hora?: number | null
          created_at?: string | null
          horas_anuales?: number | null
          id?: string
          insumos_anuales?: number | null
          produccion_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "costos_colmena_colmena_id_fkey"
            columns: ["colmena_id"]
            isOneToOne: false
            referencedRelation: "colmenas"
            referencedColumns: ["id"]
          },
        ]
      }
      creador_codigo_usos: {
        Row: {
          cliente_id: string | null
          codigo_usado: string
          comision_generada: number
          creador_id: string
          created_at: string | null
          descuento_aplicado: number
          id: string
          ip_origen: string | null
          monto_venta: number
          user_agent: string | null
          venta_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          codigo_usado: string
          comision_generada?: number
          creador_id: string
          created_at?: string | null
          descuento_aplicado?: number
          id?: string
          ip_origen?: string | null
          monto_venta: number
          user_agent?: string | null
          venta_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          codigo_usado?: string
          comision_generada?: number
          creador_id?: string
          created_at?: string | null
          descuento_aplicado?: number
          id?: string
          ip_origen?: string | null
          monto_venta?: number
          user_agent?: string | null
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creador_codigo_usos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creador_codigo_usos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "creador_codigo_usos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "creador_codigo_usos_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creador_balance_view"
            referencedColumns: ["creador_id"]
          },
          {
            foreignKeyName: "creador_codigo_usos_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creador_ranking_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creador_codigo_usos_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creadores"
            referencedColumns: ["id"]
          },
        ]
      }
      creador_comisiones: {
        Row: {
          creado_por: string | null
          creador_id: string
          created_at: string | null
          estado: Database["public"]["Enums"]["comision_estado"] | null
          id: string
          monto: number
          pagado_at: string | null
          porcentaje_aplicado: number
          uso_codigo_id: string
        }
        Insert: {
          creado_por?: string | null
          creador_id: string
          created_at?: string | null
          estado?: Database["public"]["Enums"]["comision_estado"] | null
          id?: string
          monto: number
          pagado_at?: string | null
          porcentaje_aplicado: number
          uso_codigo_id: string
        }
        Update: {
          creado_por?: string | null
          creador_id?: string
          created_at?: string | null
          estado?: Database["public"]["Enums"]["comision_estado"] | null
          id?: string
          monto?: number
          pagado_at?: string | null
          porcentaje_aplicado?: number
          uso_codigo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creador_comisiones_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creador_balance_view"
            referencedColumns: ["creador_id"]
          },
          {
            foreignKeyName: "creador_comisiones_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creador_ranking_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creador_comisiones_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creador_comisiones_uso_codigo_id_fkey"
            columns: ["uso_codigo_id"]
            isOneToOne: false
            referencedRelation: "creador_codigo_usos"
            referencedColumns: ["id"]
          },
        ]
      }
      creador_metricas_mes: {
        Row: {
          comisiones_generadas: number | null
          creador_id: string
          id: string
          mes: string
          nuevos_clientes: number | null
          ticket_promedio: number | null
          usos_codigo: number | null
          ventas_generadas: number | null
        }
        Insert: {
          comisiones_generadas?: number | null
          creador_id: string
          id?: string
          mes: string
          nuevos_clientes?: number | null
          ticket_promedio?: number | null
          usos_codigo?: number | null
          ventas_generadas?: number | null
        }
        Update: {
          comisiones_generadas?: number | null
          creador_id?: string
          id?: string
          mes?: string
          nuevos_clientes?: number | null
          ticket_promedio?: number | null
          usos_codigo?: number | null
          ventas_generadas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creador_metricas_mes_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creador_balance_view"
            referencedColumns: ["creador_id"]
          },
          {
            foreignKeyName: "creador_metricas_mes_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creador_ranking_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creador_metricas_mes_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creadores"
            referencedColumns: ["id"]
          },
        ]
      }
      creador_retiros: {
        Row: {
          creador_id: string
          created_at: string | null
          datos_pago: Json | null
          estado: string
          id: string
          metodo_pago: string | null
          monto_aprobado: number | null
          monto_solicitado: number
          notas: string | null
          revisado_at: string | null
          revisado_por: string | null
        }
        Insert: {
          creador_id: string
          created_at?: string | null
          datos_pago?: Json | null
          estado?: string
          id?: string
          metodo_pago?: string | null
          monto_aprobado?: number | null
          monto_solicitado: number
          notas?: string | null
          revisado_at?: string | null
          revisado_por?: string | null
        }
        Update: {
          creador_id?: string
          created_at?: string | null
          datos_pago?: Json | null
          estado?: string
          id?: string
          metodo_pago?: string | null
          monto_aprobado?: number | null
          monto_solicitado?: number
          notas?: string | null
          revisado_at?: string | null
          revisado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creador_retiros_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creador_balance_view"
            referencedColumns: ["creador_id"]
          },
          {
            foreignKeyName: "creador_retiros_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creador_ranking_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creador_retiros_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "creadores"
            referencedColumns: ["id"]
          },
        ]
      }
      creadores: {
        Row: {
          avatar_url: string | null
          bio: string | null
          codigo_ref: string
          created_at: string | null
          descuento_cliente: number
          estado: Database["public"]["Enums"]["creador_estado"] | null
          id: string
          nicho: string | null
          nombre_publico: string
          notas_internas: string | null
          plataforma: string | null
          plataforma_url: string | null
          porcentaje_comision: number
          seguidores_aprox: number | null
          total_comisiones: number | null
          total_pagado: number | null
          total_usos_codigo: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          codigo_ref: string
          created_at?: string | null
          descuento_cliente?: number
          estado?: Database["public"]["Enums"]["creador_estado"] | null
          id?: string
          nicho?: string | null
          nombre_publico: string
          notas_internas?: string | null
          plataforma?: string | null
          plataforma_url?: string | null
          porcentaje_comision?: number
          seguidores_aprox?: number | null
          total_comisiones?: number | null
          total_pagado?: number | null
          total_usos_codigo?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          codigo_ref?: string
          created_at?: string | null
          descuento_cliente?: number
          estado?: Database["public"]["Enums"]["creador_estado"] | null
          id?: string
          nicho?: string | null
          nombre_publico?: string
          notas_internas?: string | null
          plataforma?: string | null
          plataforma_url?: string | null
          porcentaje_comision?: number
          seguidores_aprox?: number | null
          total_comisiones?: number | null
          total_pagado?: number | null
          total_usos_codigo?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "creadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      crm_interacciones: {
        Row: {
          asunto: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          duracion_minutos: number | null
          empresa_id: string | null
          fecha_hora: string
          id: string
          lead_id: string | null
          metadata: Json | null
          proximo_seguimiento: string | null
          resultado: string | null
          tipo: string
          vendedor_id: string | null
        }
        Insert: {
          asunto?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          duracion_minutos?: number | null
          empresa_id?: string | null
          fecha_hora?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          proximo_seguimiento?: string | null
          resultado?: string | null
          tipo: string
          vendedor_id?: string | null
        }
        Update: {
          asunto?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          duracion_minutos?: number | null
          empresa_id?: string | null
          fecha_hora?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          proximo_seguimiento?: string | null
          resultado?: string | null
          tipo?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_interacciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interacciones_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          created_at: string
          email: string | null
          empresa: string | null
          empresa_id: string | null
          estado: string
          etapa_pipeline: string
          fecha_cierre_estimada: string | null
          id: string
          metadata: Json | null
          nombre: string
          notas: string | null
          origen: string | null
          probabilidad_cierre: number | null
          telefono: string | null
          updated_at: string
          valor_estimado: number | null
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          empresa_id?: string | null
          estado?: string
          etapa_pipeline?: string
          fecha_cierre_estimada?: string | null
          id?: string
          metadata?: Json | null
          nombre: string
          notas?: string | null
          origen?: string | null
          probabilidad_cierre?: number | null
          telefono?: string | null
          updated_at?: string
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          empresa_id?: string | null
          estado?: string
          etapa_pipeline?: string
          fecha_cierre_estimada?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string
          notas?: string | null
          origen?: string | null
          probabilidad_cierre?: number | null
          telefono?: string | null
          updated_at?: string
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_oportunidades: {
        Row: {
          competencia: string | null
          created_at: string
          empresa_id: string | null
          etapa: string
          fecha_cierre_estimada: string | null
          fecha_cierre_real: string | null
          id: string
          lead_id: string | null
          moneda: string | null
          motivo_perdida: string | null
          nombre: string
          notas: string | null
          probabilidad: number | null
          productos: Json | null
          updated_at: string
          valor: number
          vendedor_id: string | null
        }
        Insert: {
          competencia?: string | null
          created_at?: string
          empresa_id?: string | null
          etapa?: string
          fecha_cierre_estimada?: string | null
          fecha_cierre_real?: string | null
          id?: string
          lead_id?: string | null
          moneda?: string | null
          motivo_perdida?: string | null
          nombre: string
          notas?: string | null
          probabilidad?: number | null
          productos?: Json | null
          updated_at?: string
          valor: number
          vendedor_id?: string | null
        }
        Update: {
          competencia?: string | null
          created_at?: string
          empresa_id?: string | null
          etapa?: string
          fecha_cierre_estimada?: string | null
          fecha_cierre_real?: string | null
          id?: string
          lead_id?: string | null
          moneda?: string | null
          motivo_perdida?: string | null
          nombre?: string
          notas?: string | null
          probabilidad?: number | null
          productos?: Json | null
          updated_at?: string
          valor?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_oportunidades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_oportunidades_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tareas: {
        Row: {
          completada_at: string | null
          created_at: string
          descripcion: string | null
          empresa_id: string | null
          estado: string
          fecha_vencimiento: string
          hora: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          prioridad: string
          tipo: string | null
          titulo: string
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          completada_at?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          estado?: string
          fecha_vencimiento: string
          hora?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          prioridad?: string
          tipo?: string | null
          titulo: string
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          completada_at?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          estado?: string
          fecha_vencimiento?: string
          hora?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          prioridad?: string
          tipo?: string | null
          titulo?: string
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tareas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tareas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      declaraciones_f29: {
        Row: {
          anio: number
          created_at: string
          empresa_id: string
          estado: string
          id: string
          iva_pagar: number
          lineas: Json
          mes: number
          periodo_id: string
          ppm_determinado: number
          remanente_proximo_periodo: number
          total_pagar: number
          updated_at: string
        }
        Insert: {
          anio: number
          created_at?: string
          empresa_id: string
          estado?: string
          id?: string
          iva_pagar?: number
          lineas?: Json
          mes: number
          periodo_id: string
          ppm_determinado?: number
          remanente_proximo_periodo?: number
          total_pagar?: number
          updated_at?: string
        }
        Update: {
          anio?: number
          created_at?: string
          empresa_id?: string
          estado?: string
          id?: string
          iva_pagar?: number
          lineas?: Json
          mes?: number
          periodo_id?: string
          ppm_determinado?: number
          remanente_proximo_periodo?: number
          total_pagar?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "declaraciones_f29_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declaraciones_f29_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_contables"
            referencedColumns: ["id"]
          },
        ]
      }
      descuentos: {
        Row: {
          activo: boolean | null
          canales_aplicables: string[] | null
          categorias_aplicables: string[] | null
          clientes_aplicables: string[] | null
          codigo: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          empresa_id: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          max_usos: number | null
          productos_aplicables: string[] | null
          tipo: string
          updated_at: string
          usos_actuales: number | null
          valor: number
          valor_minimo_compra: number | null
        }
        Insert: {
          activo?: boolean | null
          canales_aplicables?: string[] | null
          categorias_aplicables?: string[] | null
          clientes_aplicables?: string[] | null
          codigo: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          max_usos?: number | null
          productos_aplicables?: string[] | null
          tipo: string
          updated_at?: string
          usos_actuales?: number | null
          valor: number
          valor_minimo_compra?: number | null
        }
        Update: {
          activo?: boolean | null
          canales_aplicables?: string[] | null
          categorias_aplicables?: string[] | null
          clientes_aplicables?: string[] | null
          codigo?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          max_usos?: number | null
          productos_aplicables?: string[] | null
          tipo?: string
          updated_at?: string
          usos_actuales?: number | null
          valor?: number
          valor_minimo_compra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "descuentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          acteco: string | null
          ciudad: string | null
          comuna: string | null
          created_at: string
          direccion: string | null
          email: string | null
          fecha_inicio_actividades: string | null
          giro: string | null
          id: string
          ingresos_brutos_anio_anterior: number
          razon_social: string
          regimen: string
          region: string | null
          rut: string
          sii_ambiente: string
          sii_clave_encriptada: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          acteco?: string | null
          ciudad?: string | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_inicio_actividades?: string | null
          giro?: string | null
          id?: string
          ingresos_brutos_anio_anterior?: number
          razon_social: string
          regimen?: string
          region?: string | null
          rut: string
          sii_ambiente?: string
          sii_clave_encriptada?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          acteco?: string | null
          ciudad?: string | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_inicio_actividades?: string | null
          giro?: string | null
          id?: string
          ingresos_brutos_anio_anterior?: number
          razon_social?: string
          regimen?: string
          region?: string | null
          rut?: string
          sii_ambiente?: string
          sii_clave_encriptada?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          created_at: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          lat: number | null
          lng: number | null
          nombre: string | null
          stock_asignado: Json | null
          ubicacion: unknown
        }
        Insert: {
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nombre?: string | null
          stock_asignado?: Json | null
          ubicacion?: unknown
        }
        Update: {
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nombre?: string | null
          stock_asignado?: Json | null
          ubicacion?: unknown
        }
        Relationships: []
      }
      facturas_compra: {
        Row: {
          created_at: string
          descripcion: string | null
          empresa_id: string
          estado_sii: string
          fecha_emision: string
          folio: number
          id: string
          monto_exento: number
          monto_iva: number
          monto_neto: number
          monto_total: number
          receptor_giro: string | null
          receptor_razon_social: string
          receptor_rut: string
          sii_response: Json
          sii_xml: string | null
          source_raw: Json | null
          source_type: string | null
          tercero_id: string | null
          tipo_dte: number
          track_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          estado_sii?: string
          fecha_emision: string
          folio: number
          id?: string
          monto_exento?: number
          monto_iva: number
          monto_neto: number
          monto_total: number
          receptor_giro?: string | null
          receptor_razon_social: string
          receptor_rut: string
          sii_response?: Json
          sii_xml?: string | null
          source_raw?: Json | null
          source_type?: string | null
          tercero_id?: string | null
          tipo_dte?: number
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          estado_sii?: string
          fecha_emision?: string
          folio?: number
          id?: string
          monto_exento?: number
          monto_iva?: number
          monto_neto?: number
          monto_total?: number
          receptor_giro?: string | null
          receptor_razon_social?: string
          receptor_rut?: string
          sii_response?: Json
          sii_xml?: string | null
          source_raw?: Json | null
          source_type?: string | null
          tercero_id?: string | null
          tipo_dte?: number
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_compra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_compra_tercero_id_fkey"
            columns: ["tercero_id"]
            isOneToOne: false
            referencedRelation: "terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas_emitidas: {
        Row: {
          caf_id: string | null
          created_at: string
          descripcion: string | null
          empresa_id: string
          estado: string
          estado_sii: string | null
          fecha_emision: string
          fecha_vencimiento: string | null
          folio: number | null
          folio_caf: number | null
          id: string
          idempotency_key: string | null
          monto_exento: number
          monto_iva: number
          monto_iva_usado: number
          monto_neto: number
          monto_total: number
          numero: string | null
          periodo_id: string | null
          sii_response: Json | null
          sii_xml: string | null
          tercero_id: string | null
          tipo_documento: string
          tipo_dte: number | null
          track_id: string | null
          updated_at: string
        }
        Insert: {
          caf_id?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          estado?: string
          estado_sii?: string | null
          fecha_emision: string
          fecha_vencimiento?: string | null
          folio?: number | null
          folio_caf?: number | null
          id?: string
          idempotency_key?: string | null
          monto_exento?: number
          monto_iva: number
          monto_iva_usado?: number
          monto_neto: number
          monto_total: number
          numero?: string | null
          periodo_id?: string | null
          sii_response?: Json | null
          sii_xml?: string | null
          tercero_id?: string | null
          tipo_documento?: string
          tipo_dte?: number | null
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          caf_id?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          estado?: string
          estado_sii?: string | null
          fecha_emision?: string
          fecha_vencimiento?: string | null
          folio?: number | null
          folio_caf?: number | null
          id?: string
          idempotency_key?: string | null
          monto_exento?: number
          monto_iva?: number
          monto_iva_usado?: number
          monto_neto?: number
          monto_total?: number
          numero?: string | null
          periodo_id?: string | null
          sii_response?: Json | null
          sii_xml?: string | null
          tercero_id?: string | null
          tipo_documento?: string
          tipo_dte?: number | null
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_emitidas_caf_id_fkey"
            columns: ["caf_id"]
            isOneToOne: false
            referencedRelation: "sii_caf"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_emitidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_emitidas_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_emitidas_tercero_id_fkey"
            columns: ["tercero_id"]
            isOneToOne: false
            referencedRelation: "terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas_recibidas: {
        Row: {
          created_at: string
          descripcion: string | null
          empresa_id: string
          estado: string
          fecha: string
          fecha_vencimiento: string | null
          id: string
          monto_exento: number
          monto_iva: number
          monto_iva_usado: number
          monto_neto: number
          monto_total: number
          numero: string
          periodo_id: string | null
          proveedor_id: string | null
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          estado?: string
          fecha: string
          fecha_vencimiento?: string | null
          id?: string
          monto_exento?: number
          monto_iva: number
          monto_iva_usado?: number
          monto_neto: number
          monto_total: number
          numero: string
          periodo_id?: string | null
          proveedor_id?: string | null
          tipo_documento?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          id?: string
          monto_exento?: number
          monto_iva?: number
          monto_iva_usado?: number
          monto_neto?: number
          monto_total?: number
          numero?: string
          periodo_id?: string | null
          proveedor_id?: string | null
          tipo_documento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_recibidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_recibidas_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_recibidas_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_documents: {
        Row: {
          created_at: string
          empresa_id: string
          extracted_text: string | null
          gasto_extranjero_id: string | null
          id: string
          mime_type: string
          proveedor_detectado: string | null
          sha256: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          extracted_text?: string | null
          gasto_extranjero_id?: string | null
          id?: string
          mime_type: string
          proveedor_detectado?: string | null
          sha256: string
          storage_path: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          extracted_text?: string | null
          gasto_extranjero_id?: string | null
          id?: string
          mime_type?: string
          proveedor_detectado?: string | null
          sha256?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_documents_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_documents_gasto_extranjero_id_fkey"
            columns: ["gasto_extranjero_id"]
            isOneToOne: false
            referencedRelation: "gastos_extranjeros"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string
          empresa_id: string
          estado: string
          fecha: string
          id: string
          idempotency_key: string | null
          monto: number | null
          monto_iva: number
          monto_neto: number
          monto_total: number
          numero_comprobante: string | null
          periodo_id: string | null
          tercero_id: string | null
          tipo_comprobante: string
          updated_at: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion: string
          empresa_id: string
          estado?: string
          fecha: string
          id?: string
          idempotency_key?: string | null
          monto?: number | null
          monto_iva: number
          monto_neto: number
          monto_total: number
          numero_comprobante?: string | null
          periodo_id?: string | null
          tercero_id?: string | null
          tipo_comprobante?: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string
          empresa_id?: string
          estado?: string
          fecha?: string
          id?: string
          idempotency_key?: string | null
          monto?: number | null
          monto_iva?: number
          monto_neto?: number
          monto_total?: number
          numero_comprobante?: string | null
          periodo_id?: string | null
          tercero_id?: string | null
          tipo_comprobante?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_tercero_id_fkey"
            columns: ["tercero_id"]
            isOneToOne: false
            referencedRelation: "terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_extranjeros: {
        Row: {
          concepto: string
          created_at: string
          detalle: string | null
          empresa_id: string
          estado: string
          factura_compra_id: string | null
          fecha_emision: string
          fiscal_document_id: string | null
          id: string
          idempotency_key: string | null
          moneda_original: string
          monto_clp: number
          monto_exento: number
          monto_iva: number
          monto_neto: number
          monto_original: number
          monto_total: number
          numero_documento: string | null
          proveedor_id: string
          proveedor_nombre: string
          proveedor_rut: string
          rcv_registro_id: string | null
          receipt_raw: string | null
          tasa_cambio: number
          updated_at: string
        }
        Insert: {
          concepto: string
          created_at?: string
          detalle?: string | null
          empresa_id: string
          estado?: string
          factura_compra_id?: string | null
          fecha_emision: string
          fiscal_document_id?: string | null
          id?: string
          idempotency_key?: string | null
          moneda_original?: string
          monto_clp: number
          monto_exento?: number
          monto_iva?: number
          monto_neto?: number
          monto_original: number
          monto_total: number
          numero_documento?: string | null
          proveedor_id: string
          proveedor_nombre: string
          proveedor_rut: string
          rcv_registro_id?: string | null
          receipt_raw?: string | null
          tasa_cambio?: number
          updated_at?: string
        }
        Update: {
          concepto?: string
          created_at?: string
          detalle?: string | null
          empresa_id?: string
          estado?: string
          factura_compra_id?: string | null
          fecha_emision?: string
          fiscal_document_id?: string | null
          id?: string
          idempotency_key?: string | null
          moneda_original?: string
          monto_clp?: number
          monto_exento?: number
          monto_iva?: number
          monto_neto?: number
          monto_original?: number
          monto_total?: number
          numero_documento?: string | null
          proveedor_id?: string
          proveedor_nombre?: string
          proveedor_rut?: string
          rcv_registro_id?: string | null
          receipt_raw?: string | null
          tasa_cambio?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_extranjeros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_extranjeros_factura_compra_id_fkey"
            columns: ["factura_compra_id"]
            isOneToOne: false
            referencedRelation: "facturas_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_extranjeros_fiscal_document_id_fkey"
            columns: ["fiscal_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_extranjeros_rcv_registro_id_fkey"
            columns: ["rcv_registro_id"]
            isOneToOne: false
            referencedRelation: "rcv_registros"
            referencedColumns: ["id"]
          },
        ]
      }
      honey_analysis: {
        Row: {
          acidez_libre_meq: number | null
          actividad_antimicrobiana: string | null
          color_pfund: number | null
          created_at: string | null
          diastasa_actividad: number | null
          fecha_analisis: string
          glucosa_oxidasa: boolean | null
          hmf_mg_kg: number | null
          humedad_pct: number | null
          id: string
          indice_glicemico_estimado: number | null
          invertasa_actividad: number | null
          laboratorio: string | null
          lote_id: string | null
          notas: string | null
          perfil_polen: Json | null
          ph: number | null
          producto_id: string | null
          updated_at: string | null
        }
        Insert: {
          acidez_libre_meq?: number | null
          actividad_antimicrobiana?: string | null
          color_pfund?: number | null
          created_at?: string | null
          diastasa_actividad?: number | null
          fecha_analisis?: string
          glucosa_oxidasa?: boolean | null
          hmf_mg_kg?: number | null
          humedad_pct?: number | null
          id?: string
          indice_glicemico_estimado?: number | null
          invertasa_actividad?: number | null
          laboratorio?: string | null
          lote_id?: string | null
          notas?: string | null
          perfil_polen?: Json | null
          ph?: number | null
          producto_id?: string | null
          updated_at?: string | null
        }
        Update: {
          acidez_libre_meq?: number | null
          actividad_antimicrobiana?: string | null
          color_pfund?: number | null
          created_at?: string | null
          diastasa_actividad?: number | null
          fecha_analisis?: string
          glucosa_oxidasa?: boolean | null
          hmf_mg_kg?: number | null
          humedad_pct?: number | null
          id?: string
          indice_glicemico_estimado?: number | null
          invertasa_actividad?: number | null
          laboratorio?: string | null
          lote_id?: string | null
          notas?: string | null
          perfil_polen?: Json | null
          ph?: number | null
          producto_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "honey_analysis_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honey_analysis_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      honorarios: {
        Row: {
          created_at: string
          descripcion: string
          empresa_id: string
          estado: string
          fecha: string
          id: string
          monto_bruto: number
          monto_retencion: number
          numero_bhe: string | null
          periodo_id: string | null
          tasa_retencion: number
          tercero_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          empresa_id: string
          estado?: string
          fecha: string
          id?: string
          monto_bruto: number
          monto_retencion: number
          numero_bhe?: string | null
          periodo_id?: string | null
          tasa_retencion?: number
          tercero_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          empresa_id?: string
          estado?: string
          fecha?: string
          id?: string
          monto_bruto?: number
          monto_retencion?: number
          numero_bhe?: string | null
          periodo_id?: string | null
          tasa_retencion?: number
          tercero_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "honorarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honorarios_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honorarios_tercero_id_fkey"
            columns: ["tercero_id"]
            isOneToOne: false
            referencedRelation: "terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      impuestos: {
        Row: {
          created_at: string
          empresa_id: string
          estado: string
          id: string
          monto: number
          periodo_id: string | null
          tipo: string
          updated_at: string
          vencimiento: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estado?: string
          id?: string
          monto: number
          periodo_id?: string | null
          tipo: string
          updated_at?: string
          vencimiento?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estado?: string
          id?: string
          monto?: number
          periodo_id?: string | null
          tipo?: string
          updated_at?: string
          vencimiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impuestos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impuestos_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_contables"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          categoria: string | null
          created_at: string
          empresa_id: string
          estado_default: string
          id: string
          nombre: string
          precio_ref: number | null
          proveedor_ref: string | null
          unidad: string
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          empresa_id: string
          estado_default: string
          id?: string
          nombre: string
          precio_ref?: number | null
          proveedor_ref?: string | null
          unidad: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          empresa_id?: string
          estado_default?: string
          id?: string
          nombre?: string
          precio_ref?: number | null
          proveedor_ref?: string | null
          unidad?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_proveedor_ref_fkey"
            columns: ["proveedor_ref"]
            isOneToOne: false
            referencedRelation: "terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      inspecciones: {
        Row: {
          colmena_id: string | null
          created_at: string | null
          date: string
          enjambrazon_riesgo: string | null
          foto_url: string | null
          id: string
          inspector: string | null
          marcos_cria: number | null
          marcos_miel: number | null
          notes: string | null
          poblacion: string | null
          reina: boolean | null
          user_id: string | null
          varroa: number | null
        }
        Insert: {
          colmena_id?: string | null
          created_at?: string | null
          date?: string
          enjambrazon_riesgo?: string | null
          foto_url?: string | null
          id?: string
          inspector?: string | null
          marcos_cria?: number | null
          marcos_miel?: number | null
          notes?: string | null
          poblacion?: string | null
          reina?: boolean | null
          user_id?: string | null
          varroa?: number | null
        }
        Update: {
          colmena_id?: string | null
          created_at?: string | null
          date?: string
          enjambrazon_riesgo?: string | null
          foto_url?: string | null
          id?: string
          inspector?: string | null
          marcos_cria?: number | null
          marcos_miel?: number | null
          notes?: string | null
          poblacion?: string | null
          reina?: boolean | null
          user_id?: string | null
          varroa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecciones_colmena_id_fkey"
            columns: ["colmena_id"]
            isOneToOne: false
            referencedRelation: "colmenas"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_job_runs: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          executed_by: string | null
          finished_at: string | null
          id: string
          integration_key: string
          payload: Json
          started_at: string | null
          stats: Json
          status: string
          trigger_type: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          executed_by?: string | null
          finished_at?: string | null
          id?: string
          integration_key: string
          payload?: Json
          started_at?: string | null
          stats?: Json
          status?: string
          trigger_type?: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          executed_by?: string | null
          finished_at?: string | null
          id?: string
          integration_key?: string
          payload?: Json
          started_at?: string | null
          stats?: Json
          status?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_job_runs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_job_runs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "integration_job_runs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string
          current_uses: number
          empresa_id: string
          expires_at: string | null
          id: string
          max_uses: number | null
          roles: string[]
          tools: Json
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by: string
          current_uses?: number
          empresa_id: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          roles?: string[]
          tools?: Json
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string
          current_uses?: number
          empresa_id?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          roles?: string[]
          tools?: Json
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_redemptions: {
        Row: {
          id: string
          invitation_id: string
          redeemed_at: string
          roles_assigned: string[]
          tools_assigned: Json
          user_id: string
        }
        Insert: {
          id?: string
          invitation_id: string
          redeemed_at?: string
          roles_assigned: string[]
          tools_assigned?: Json
          user_id: string
        }
        Update: {
          id?: string
          invitation_id?: string
          redeemed_at?: string
          roles_assigned?: string[]
          tools_assigned?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_redemptions_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitation_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      irr_records: {
        Row: {
          arboles_asociados: number | null
          co2_capturado_kg: number
          co2_emitido_kg: number
          colmenas_activas: number | null
          created_at: string | null
          id: string
          irr: number | null
          lote_id: string | null
          metodologia: string | null
          notas: string | null
          periodo: string
          producto_id: string | null
          updated_at: string | null
        }
        Insert: {
          arboles_asociados?: number | null
          co2_capturado_kg?: number
          co2_emitido_kg?: number
          colmenas_activas?: number | null
          created_at?: string | null
          id?: string
          irr?: number | null
          lote_id?: string | null
          metodologia?: string | null
          notas?: string | null
          periodo: string
          producto_id?: string | null
          updated_at?: string | null
        }
        Update: {
          arboles_asociados?: number | null
          co2_capturado_kg?: number
          co2_emitido_kg?: number
          colmenas_activas?: number | null
          created_at?: string | null
          id?: string
          irr?: number | null
          lote_id?: string | null
          metodologia?: string | null
          notas?: string | null
          periodo?: string
          producto_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "irr_records_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "irr_records_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      logistica_envios: {
        Row: {
          created_at: string | null
          destino: string
          empresa_id: string | null
          eta: string | null
          id: string
          items: string
          status: string
          tracking_code: string
          user_id: string | null
          venta_id: string | null
          via: string | null
        }
        Insert: {
          created_at?: string | null
          destino: string
          empresa_id?: string | null
          eta?: string | null
          id?: string
          items: string
          status: string
          tracking_code: string
          user_id?: string | null
          venta_id?: string | null
          via?: string | null
        }
        Update: {
          created_at?: string | null
          destino?: string
          empresa_id?: string | null
          eta?: string | null
          id?: string
          items?: string
          status?: string
          tracking_code?: string
          user_id?: string | null
          venta_id?: string | null
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistica_envios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes: {
        Row: {
          arboles_asociados: number | null
          blockchain_hash: string | null
          cosecha_ids: string[] | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha_envasado: string | null
          id: string
          kg_total: number | null
          nombre_lote: string | null
        }
        Insert: {
          arboles_asociados?: number | null
          blockchain_hash?: string | null
          cosecha_ids?: string[] | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_envasado?: string | null
          id?: string
          kg_total?: number | null
          nombre_lote?: string | null
        }
        Update: {
          arboles_asociados?: number | null
          blockchain_hash?: string | null
          cosecha_ids?: string[] | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_envasado?: string | null
          id?: string
          kg_total?: number | null
          nombre_lote?: string | null
        }
        Relationships: []
      }
      loyalty_redemptions: {
        Row: {
          created_at: string | null
          fulfilled_at: string | null
          id: string
          idempotency_key: string | null
          points_spent: number
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fulfilled_at?: string | null
          id?: string
          idempotency_key?: string | null
          points_spent: number
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          fulfilled_at?: string | null
          id?: string
          idempotency_key?: string | null
          points_spent?: number
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          points_cost: number
          reward_type: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          points_cost: number
          reward_type: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          points_cost?: number
          reward_type?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          action_type: Database["public"]["Enums"]["accion_tipo"]
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          points: number
          source_id: string | null
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["accion_tipo"]
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          source_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["accion_tipo"]
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "loyalty_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          created_at: string | null
          id: string
          impact: string
          name: string
          period: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          impact: string
          name: string
          period: string
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          impact?: string
          name?: string
          period?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketing_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          platform: string | null
          post_date: string
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          platform?: string | null
          post_date: string
          status: string
          type: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          platform?: string | null
          post_date?: string
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      niveles_fidelizacion: {
        Row: {
          activo: boolean | null
          beneficios: Json | null
          created_at: string
          empresa_id: string | null
          id: string
          multiplicador_puntos: number
          nivel: string
          puntos_requeridos: number
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          beneficios?: Json | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          multiplicador_puntos?: number
          nivel: string
          puntos_requeridos: number
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          beneficios?: Json | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          multiplicador_puntos?: number
          nivel?: string
          puntos_requeridos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "niveles_fidelizacion_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          created_by: string | null
          id: string
          provider_response: Json
          recipient: string | null
          status: string
          subject: string | null
        }
        Insert: {
          body?: string | null
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          provider_response?: Json
          recipient?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          provider_response?: Json
          recipient?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number
          body: string
          channel: string
          created_at: string
          empresa_id: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number
          metadata: Json
          recipient: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          body: string
          channel: string
          created_at?: string
          empresa_id?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          metadata?: Json
          recipient: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          body?: string
          channel?: string
          created_at?: string
          empresa_id?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          metadata?: Json
          recipient?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_failures: {
        Row: {
          checkout_session_id: string
          created_at: string
          error_message: string | null
          id: string
          max_retries: number
          next_retry_at: string | null
          provider: string
          resolved_at: string | null
          retry_count: number
          status: string
          updated_at: string
          webhook_payload: Json
        }
        Insert: {
          checkout_session_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          provider: string
          resolved_at?: string | null
          retry_count?: number
          status?: string
          updated_at?: string
          webhook_payload: Json
        }
        Update: {
          checkout_session_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          provider?: string
          resolved_at?: string | null
          retry_count?: number
          status?: string
          updated_at?: string
          webhook_payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "payment_failures_checkout_session_id_fkey"
            columns: ["checkout_session_id"]
            isOneToOne: false
            referencedRelation: "checkout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_cliente: {
        Row: {
          created_at: string | null
          id: string
          items: string
          order_date: string
          status: string
          trees_planted: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items: string
          order_date: string
          status: string
          trees_planted?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: string
          order_date?: string
          status?: string
          trees_planted?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      periodos_contables: {
        Row: {
          anio: number
          created_at: string
          egresos_netos: number
          empresa_id: string
          estado: string
          fecha_inicio: string | null
          fecha_termino: string | null
          id: string
          ingresos_netos: number
          iva_credito: number
          iva_debito: number
          iva_pagar: number
          mes: number
          nombre: string | null
          ppm_calculado: number
          remanente_cf_anterior: number
          remanente_cf_proximo: number
          updated_at: string
          utilidad_bruta: number
          utilidad_neta: number
        }
        Insert: {
          anio: number
          created_at?: string
          egresos_netos?: number
          empresa_id: string
          estado?: string
          fecha_inicio?: string | null
          fecha_termino?: string | null
          id?: string
          ingresos_netos?: number
          iva_credito?: number
          iva_debito?: number
          iva_pagar?: number
          mes: number
          nombre?: string | null
          ppm_calculado?: number
          remanente_cf_anterior?: number
          remanente_cf_proximo?: number
          updated_at?: string
          utilidad_bruta?: number
          utilidad_neta?: number
        }
        Update: {
          anio?: number
          created_at?: string
          egresos_netos?: number
          empresa_id?: string
          estado?: string
          fecha_inicio?: string | null
          fecha_termino?: string | null
          id?: string
          ingresos_netos?: number
          iva_credito?: number
          iva_debito?: number
          iva_pagar?: number
          mes?: number
          nombre?: string | null
          ppm_calculado?: number
          remanente_cf_anterior?: number
          remanente_cf_proximo?: number
          updated_at?: string
          utilidad_bruta?: number
          utilidad_neta?: number
        }
        Relationships: [
          {
            foreignKeyName: "periodos_contables_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      peso_records: {
        Row: {
          colmena_id: string | null
          created_at: string | null
          date: string
          id: string
          kg: number
          note: string | null
          user_id: string | null
        }
        Insert: {
          colmena_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          kg: number
          note?: string | null
          user_id?: string | null
        }
        Update: {
          colmena_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          kg?: number
          note?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peso_records_colmena_id_fkey"
            columns: ["colmena_id"]
            isOneToOne: false
            referencedRelation: "colmenas"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_orders: {
        Row: {
          converted_venta_id: string | null
          created_at: string | null
          deposit_amount: number | null
          email: string | null
          id: string
          producto_id: string | null
          quantity: number
          status: string
          user_id: string
        }
        Insert: {
          converted_venta_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          email?: string | null
          id?: string
          producto_id?: string | null
          quantity?: number
          status?: string
          user_id: string
        }
        Update: {
          converted_venta_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          email?: string | null
          id?: string
          producto_id?: string | null
          quantity?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_orders_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pre_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      price_observations: {
        Row: {
          created_at: string
          created_by: string | null
          empresa_id: string
          fecha: string
          fuente: string
          id: string
          ingredient_id: string
          notas: string | null
          precio: number
          proveedor_id: string | null
          unidad_reportada: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          empresa_id: string
          fecha?: string
          fuente?: string
          id?: string
          ingredient_id: string
          notas?: string | null
          precio: number
          proveedor_id?: string | null
          unidad_reportada?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          fecha?: string
          fuente?: string
          id?: string
          ingredient_id?: string
          notas?: string | null
          precio?: number
          proveedor_id?: string | null
          unidad_reportada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_observations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria: string | null
          co2_evitado_kg: number | null
          created_at: string | null
          descripcion_corta: string | null
          descripcion_regenerativa: string | null
          formato: string | null
          fotos: string[] | null
          id: string
          ingredientes: string | null
          irr_referencia: number | null
          lote_id: string | null
          nombre: string | null
          origen_apicola: string | null
          peso_neto_g: number | null
          precio: number | null
          slug: string | null
          stock: number | null
          sustituye_azucar_g: number | null
          tags: string[] | null
          trazabilidad_qr: boolean | null
          updated_at: string | null
          video_url: string | null
          visible: boolean | null
        }
        Insert: {
          categoria?: string | null
          co2_evitado_kg?: number | null
          created_at?: string | null
          descripcion_corta?: string | null
          descripcion_regenerativa?: string | null
          formato?: string | null
          fotos?: string[] | null
          id?: string
          ingredientes?: string | null
          irr_referencia?: number | null
          lote_id?: string | null
          nombre?: string | null
          origen_apicola?: string | null
          peso_neto_g?: number | null
          precio?: number | null
          slug?: string | null
          stock?: number | null
          sustituye_azucar_g?: number | null
          tags?: string[] | null
          trazabilidad_qr?: boolean | null
          updated_at?: string | null
          video_url?: string | null
          visible?: boolean | null
        }
        Update: {
          categoria?: string | null
          co2_evitado_kg?: number | null
          created_at?: string | null
          descripcion_corta?: string | null
          descripcion_regenerativa?: string | null
          formato?: string | null
          fotos?: string[] | null
          id?: string
          ingredientes?: string | null
          irr_referencia?: number | null
          lote_id?: string | null
          nombre?: string | null
          origen_apicola?: string | null
          peso_neto_g?: number | null
          precio?: number | null
          slug?: string | null
          stock?: number | null
          sustituye_azucar_g?: number | null
          tags?: string[] | null
          trazabilidad_qr?: boolean | null
          updated_at?: string | null
          video_url?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          notification_preferences: Json
          referred_by: string | null
          role: string
          theme_preference: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          notification_preferences?: Json
          referred_by?: string | null
          role?: string
          theme_preference?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notification_preferences?: Json
          referred_by?: string | null
          role?: string
          theme_preference?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      proveedores: {
        Row: {
          created_at: string | null
          id: string
          item: string
          name: string
          next_delivery: string | null
          urgent: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item: string
          name: string
          next_delivery?: string | null
          urgent?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item?: string
          name?: string
          next_delivery?: string | null
          urgent?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      proveedores_config: {
        Row: {
          activo: boolean
          con_iva: boolean
          created_at: string
          empresa_id: string
          giro: string
          id: string
          moneda: string
          nombre: string
          proveedor_id: string
          rut: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          con_iva?: boolean
          created_at?: string
          empresa_id: string
          giro: string
          id?: string
          moneda?: string
          nombre: string
          proveedor_id: string
          rut: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          con_iva?: boolean
          created_at?: string
          empresa_id?: string
          giro?: string
          id?: string
          moneda?: string
          nombre?: string
          proveedor_id?: string
          rut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      puntos_fidelizacion: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          nivel_actual: string
          puntos: number
          puntos_acumulados_total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nivel_actual?: string
          puntos?: number
          puntos_acumulados_total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nivel_actual?: string
          puntos?: number
          puntos_acumulados_total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "puntos_fidelizacion_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      puntos_transacciones: {
        Row: {
          created_at: string
          created_by: string | null
          empresa_id: string | null
          id: string
          metadata: Json | null
          motivo: string | null
          puntos: number
          saldo_anterior: number
          saldo_nuevo: number
          tipo: string
          user_id: string | null
          venta_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          metadata?: Json | null
          motivo?: string | null
          puntos: number
          saldo_anterior: number
          saldo_nuevo: number
          tipo: string
          user_id?: string | null
          venta_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          id?: string
          metadata?: Json | null
          motivo?: string | null
          puntos?: number
          saldo_anterior?: number
          saldo_nuevo?: number
          tipo?: string
          user_id?: string | null
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "puntos_transacciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_transacciones_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_transacciones_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas_pendientes_logistica"
            referencedColumns: ["venta_id"]
          },
        ]
      }
      qr_audit_trail: {
        Row: {
          created_at: string
          event_hash: string
          evento: string
          id: string
          latitud: number | null
          longitud: number | null
          metadata: Json | null
          qr_id: string | null
          ubicacion: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          event_hash: string
          evento: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          metadata?: Json | null
          qr_id?: string | null
          ubicacion?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          event_hash?: string
          evento?: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          metadata?: Json | null
          qr_id?: string | null
          ubicacion?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_audit_trail_qr_id_fkey"
            columns: ["qr_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          activo: boolean | null
          apiario_id: string | null
          codigo: string
          cosecha_id: string | null
          created_at: string
          created_by: string | null
          empresa_id: string | null
          fecha_produccion: string
          fecha_vencimiento: string | null
          id: string
          lote_id: string
          producto_id: string | null
        }
        Insert: {
          activo?: boolean | null
          apiario_id?: string | null
          codigo: string
          cosecha_id?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          fecha_produccion: string
          fecha_vencimiento?: string | null
          id?: string
          lote_id: string
          producto_id?: string | null
        }
        Update: {
          activo?: boolean | null
          apiario_id?: string | null
          codigo?: string
          cosecha_id?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          fecha_produccion?: string
          fecha_vencimiento?: string | null
          id?: string
          lote_id?: string
          producto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_apiario_id_fkey"
            columns: ["apiario_id"]
            isOneToOne: false
            referencedRelation: "apiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_cosecha_id_fkey"
            columns: ["cosecha_id"]
            isOneToOne: false
            referencedRelation: "cosechas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      rcv_registros: {
        Row: {
          created_at: string
          empresa_id: string
          estado_rcv: string
          factura_compra_id: string | null
          factura_emitida_id: string | null
          fecha_emision: string
          folio: number
          id: string
          metadata: Json
          monto_exento: number
          monto_iva: number
          monto_neto: number
          monto_total: number
          razon_social_contraparte: string
          rcv_sync_id: string
          reconciliado: boolean
          rut_contraparte: string
          tipo_dte: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estado_rcv?: string
          factura_compra_id?: string | null
          factura_emitida_id?: string | null
          fecha_emision: string
          folio: number
          id?: string
          metadata?: Json
          monto_exento?: number
          monto_iva?: number
          monto_neto?: number
          monto_total?: number
          razon_social_contraparte: string
          rcv_sync_id: string
          reconciliado?: boolean
          rut_contraparte: string
          tipo_dte: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estado_rcv?: string
          factura_compra_id?: string | null
          factura_emitida_id?: string | null
          fecha_emision?: string
          folio?: number
          id?: string
          metadata?: Json
          monto_exento?: number
          monto_iva?: number
          monto_neto?: number
          monto_total?: number
          razon_social_contraparte?: string
          rcv_sync_id?: string
          reconciliado?: boolean
          rut_contraparte?: string
          tipo_dte?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rcv_registros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rcv_registros_factura_compra_id_fkey"
            columns: ["factura_compra_id"]
            isOneToOne: false
            referencedRelation: "facturas_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rcv_registros_rcv_sync_id_fkey"
            columns: ["rcv_sync_id"]
            isOneToOne: false
            referencedRelation: "rcv_sync"
            referencedColumns: ["id"]
          },
        ]
      }
      rcv_sync: {
        Row: {
          created_at: string
          empresa_id: string
          estado: string
          id: string
          periodo: string
          sii_response: Json
          tipo_registro: string
          total_documentos: number
          total_exento: number
          total_iva: number
          total_neto: number
          total_total: number
          ultimo_sync: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estado?: string
          id?: string
          periodo: string
          sii_response?: Json
          tipo_registro: string
          total_documentos?: number
          total_exento?: number
          total_iva?: number
          total_neto?: number
          total_total?: number
          ultimo_sync?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estado?: string
          id?: string
          periodo?: string
          sii_response?: Json
          tipo_registro?: string
          total_documentos?: number
          total_exento?: number
          total_iva?: number
          total_neto?: number
          total_total?: number
          ultimo_sync?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rcv_sync_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_lines: {
        Row: {
          cantidad: number
          estado: string
          factor_conversion: number
          id: string
          ingredient_id: string
          orden: number
          recipe_id: string
        }
        Insert: {
          cantidad: number
          estado: string
          factor_conversion?: number
          id?: string
          ingredient_id: string
          orden?: number
          recipe_id: string
        }
        Update: {
          cantidad?: number
          estado?: string
          factor_conversion?: number
          id?: string
          ingredient_id?: string
          orden?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_lines_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_lines_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_costing_view"
            referencedColumns: ["recipe_id"]
          },
          {
            foreignKeyName: "recipe_lines_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          activa: boolean
          costo_empaque: number
          created_at: string
          empresa_id: string
          formato_frasco: string
          id: string
          merma_pct: number
          notas: string | null
          producto_id: string
          rendimiento_frascos: number
          updated_at: string | null
          version: number
        }
        Insert: {
          activa?: boolean
          costo_empaque?: number
          created_at?: string
          empresa_id: string
          formato_frasco: string
          id?: string
          merma_pct?: number
          notas?: string | null
          producto_id: string
          rendimiento_frascos: number
          updated_at?: string | null
          version?: number
        }
        Update: {
          activa?: boolean
          costo_empaque?: number
          created_at?: string
          empresa_id?: string
          formato_frasco?: string
          id?: string
          merma_pct?: number
          notas?: string | null
          producto_id?: string
          rendimiento_frascos?: number
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      recompensas_fidelizacion: {
        Row: {
          activa: boolean | null
          created_at: string
          descripcion: string | null
          empresa_id: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          imagen_url: string | null
          nivel_minimo: string | null
          nombre: string
          puntos_requeridos: number
          stock: number | null
          stock_ilimitado: boolean | null
          tipo: string
          updated_at: string
          valor: Json
        }
        Insert: {
          activa?: boolean | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          imagen_url?: string | null
          nivel_minimo?: string | null
          nombre: string
          puntos_requeridos: number
          stock?: number | null
          stock_ilimitado?: boolean | null
          tipo: string
          updated_at?: string
          valor: Json
        }
        Update: {
          activa?: boolean | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          imagen_url?: string | null
          nivel_minimo?: string | null
          nombre?: string
          puntos_requeridos?: number
          stock?: number | null
          stock_ilimitado?: boolean | null
          tipo?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "recompensas_fidelizacion_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_rules: {
        Row: {
          activo: boolean
          actualizado_en: string
          campo_primario: string
          campo_secundario: string | null
          creado_en: string
          empresa_id: string
          id: string
          nombre: string
          operador: string
          operador_secundario: string | null
          prioridad: number
          tipo: string
          valor_primario: string | null
          valor_secundario: string | null
          valor_secundario_2: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          campo_primario: string
          campo_secundario?: string | null
          creado_en?: string
          empresa_id: string
          id?: string
          nombre: string
          operador: string
          operador_secundario?: string | null
          prioridad?: number
          tipo: string
          valor_primario?: string | null
          valor_secundario?: string | null
          valor_secundario_2?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          campo_primario?: string
          campo_secundario?: string | null
          creado_en?: string
          empresa_id?: string
          id?: string
          nombre?: string
          operador?: string
          operador_secundario?: string | null
          prioridad?: number
          tipo?: string
          valor_primario?: string | null
          valor_secundario?: string | null
          valor_secundario_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_rules_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      reflexiones: {
        Row: {
          colmena_id: string | null
          created_at: string | null
          fecha: string
          foto_url: string | null
          id: string
          texto: string
          user_id: string | null
        }
        Insert: {
          colmena_id?: string | null
          created_at?: string | null
          fecha?: string
          foto_url?: string | null
          id?: string
          texto: string
          user_id?: string | null
        }
        Update: {
          colmena_id?: string | null
          created_at?: string | null
          fecha?: string
          foto_url?: string | null
          id?: string
          texto?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflexiones_colmena_id_fkey"
            columns: ["colmena_id"]
            isOneToOne: false
            referencedRelation: "colmenas"
            referencedColumns: ["id"]
          },
        ]
      }
      reina_history: {
        Row: {
          colmena_id: string | null
          created_at: string | null
          generation: string
          id: string
          origin: string | null
          since: string | null
          status: string | null
        }
        Insert: {
          colmena_id?: string | null
          created_at?: string | null
          generation: string
          id?: string
          origin?: string | null
          since?: string | null
          status?: string | null
        }
        Update: {
          colmena_id?: string | null
          created_at?: string | null
          generation?: string
          id?: string
          origin?: string | null
          since?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reina_history_colmena_id_fkey"
            columns: ["colmena_id"]
            isOneToOne: false
            referencedRelation: "colmenas"
            referencedColumns: ["id"]
          },
        ]
      }
      remanente_credito_fiscal: {
        Row: {
          created_at: string
          empresa_id: string
          factor_utm: number
          id: string
          monto: number
          monto_reajustado: number
          periodo_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          factor_utm?: number
          id?: string
          monto: number
          monto_reajustado: number
          periodo_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          factor_utm?: number
          id?: string
          monto?: number
          monto_reajustado?: number
          periodo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remanente_credito_fiscal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remanente_credito_fiscal_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_contables"
            referencedColumns: ["id"]
          },
        ]
      }
      rep_profiles: {
        Row: {
          active: boolean
          best_streak_days: number
          clients_captured: number
          commission_tier: string
          created_at: string
          current_streak_days: number
          deactivated_at: string | null
          display_name: string
          empresa_id: string
          fixed_monthly: number
          id: string
          notas: string | null
          onboarded_at: string
          tier_override: string | null
          tier_promoted_at: string | null
          total_commissions_earned: number
          total_commissions_paid: number
          total_revenue_lifetime: number
          total_sales_lifetime: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          best_streak_days?: number
          clients_captured?: number
          commission_tier?: string
          created_at?: string
          current_streak_days?: number
          deactivated_at?: string | null
          display_name: string
          empresa_id: string
          fixed_monthly?: number
          id?: string
          notas?: string | null
          onboarded_at?: string
          tier_override?: string | null
          tier_promoted_at?: string | null
          total_commissions_earned?: number
          total_commissions_paid?: number
          total_revenue_lifetime?: number
          total_sales_lifetime?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          best_streak_days?: number
          clients_captured?: number
          commission_tier?: string
          created_at?: string
          current_streak_days?: number
          deactivated_at?: string | null
          display_name?: string
          empresa_id?: string
          fixed_monthly?: number
          id?: string
          notas?: string | null
          onboarded_at?: string
          tier_override?: string | null
          tier_promoted_at?: string | null
          total_commissions_earned?: number
          total_commissions_paid?: number
          total_revenue_lifetime?: number
          total_sales_lifetime?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rep_profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rep_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rep_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rep_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reportes: {
        Row: {
          anio: number
          archivo_url: string | null
          created_at: string
          datos: Json
          descripcion: string | null
          empresa_id: string
          estado: string
          id: string
          mes: number | null
          nombre: string
          periodo: string
          tipo: string
          updated_at: string
        }
        Insert: {
          anio: number
          archivo_url?: string | null
          created_at?: string
          datos?: Json
          descripcion?: string | null
          empresa_id: string
          estado?: string
          id?: string
          mes?: number | null
          nombre: string
          periodo: string
          tipo: string
          updated_at?: string
        }
        Update: {
          anio?: number
          archivo_url?: string | null
          created_at?: string
          datos?: Json
          descripcion?: string | null
          empresa_id?: string
          estado?: string
          id?: string
          mes?: number | null
          nombre?: string
          periodo?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      resenas_sensoriales: {
        Row: {
          created_at: string | null
          cristalizacion_percibida: string | null
          familia_aromatica: string | null
          id: string
          intensidad_fondo: number | null
          lote_id: string | null
          notas_personales: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          cristalizacion_percibida?: string | null
          familia_aromatica?: string | null
          id?: string
          intensidad_fondo?: number | null
          lote_id?: string | null
          notas_personales?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          cristalizacion_percibida?: string | null
          familia_aromatica?: string | null
          id?: string
          intensidad_fondo?: number | null
          lote_id?: string | null
          notas_personales?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resenas_sensoriales_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenas_sensoriales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenas_sensoriales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resenas_sensoriales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      revendedor_profile: {
        Row: {
          created_at: string | null
          direccion: string | null
          estado: Database["public"]["Enums"]["perfil_estado"] | null
          razon_social: string
          region: string | null
          rut: string
          tipo_negocio: string | null
          updated_at: string | null
          user_id: string
          volumen_kg_mes: number | null
        }
        Insert: {
          created_at?: string | null
          direccion?: string | null
          estado?: Database["public"]["Enums"]["perfil_estado"] | null
          razon_social: string
          region?: string | null
          rut: string
          tipo_negocio?: string | null
          updated_at?: string | null
          user_id: string
          volumen_kg_mes?: number | null
        }
        Update: {
          created_at?: string | null
          direccion?: string | null
          estado?: Database["public"]["Enums"]["perfil_estado"] | null
          razon_social?: string
          region?: string | null
          rut?: string
          tipo_negocio?: string | null
          updated_at?: string | null
          user_id?: string
          volumen_kg_mes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revendedor_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revendedor_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "revendedor_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      security_events: {
        Row: {
          app_source: string
          created_at: string
          details: Json
          email: string
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app_source: string
          created_at?: string
          details?: Json
          email: string
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app_source?: string
          created_at?: string
          details?: Json
          email?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sii_caf: {
        Row: {
          activo: boolean
          created_at: string
          empresa_id: string
          fch_resol: string
          fecha_autorizacion: string
          firma_caf: string
          folio_actual: number
          folio_desde: number
          folio_hasta: number
          id: string
          nro_resol: number
          private_key: string
          public_key: string
          tipo_dte: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          empresa_id: string
          fch_resol?: string
          fecha_autorizacion: string
          firma_caf: string
          folio_actual: number
          folio_desde: number
          folio_hasta: number
          id?: string
          nro_resol?: number
          private_key: string
          public_key: string
          tipo_dte: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          empresa_id?: string
          fch_resol?: string
          fecha_autorizacion?: string
          firma_caf?: string
          folio_actual?: number
          folio_desde?: number
          folio_hasta?: number
          id?: string
          nro_resol?: number
          private_key?: string
          public_key?: string
          tipo_dte?: number
        }
        Relationships: [
          {
            foreignKeyName: "sii_caf_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      sii_certificados: {
        Row: {
          activo: boolean
          created_at: string
          empresa_id: string
          id: string
          nombre: string
          storage_path: string
          updated_at: string
          vigencia_fin: string
          vigencia_inicio: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nombre: string
          storage_path: string
          updated_at?: string
          vigencia_fin: string
          vigencia_inicio: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nombre?: string
          storage_path?: string
          updated_at?: string
          vigencia_fin?: string
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "sii_certificados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      sii_document_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          empresa_id: string
          id: string
          idempotency_key: string
          last_error: string | null
          payload: Json
          scheduled_at: string
          source_id: string
          source_type: string
          status: string
          tipo_dte: number
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          payload?: Json
          scheduled_at?: string
          source_id: string
          source_type: string
          status?: string
          tipo_dte: number
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          payload?: Json
          scheduled_at?: string
          source_id?: string
          source_type?: string
          status?: string
          tipo_dte?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sii_document_jobs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      sii_sync_runs: {
        Row: {
          created_at: string
          detail: string | null
          executed_by: string | null
          id: string
          payload: Json
          status: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          executed_by?: string | null
          id?: string
          payload?: Json
          status?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          executed_by?: string | null
          id?: string
          payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sii_sync_runs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sii_sync_runs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sii_sync_runs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      site_content: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          item_order: number | null
          section_key: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_order?: number | null
          section_key: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_order?: number | null
          section_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      source_files: {
        Row: {
          created_at: string
          filename: string
          id: string
          meta: Json
          mime_type: string | null
          source_type: string
          status: string
          storage_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          meta?: Json
          mime_type?: string | null
          source_type: string
          status?: string
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          meta?: Json
          mime_type?: string | null
          source_type?: string
          status?: string
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "source_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      stock_centers: {
        Row: {
          cofres: number | null
          created_at: string | null
          frascos: number | null
          id: string
          name: string
          ok: boolean | null
          sachets: number | null
          user_id: string | null
        }
        Insert: {
          cofres?: number | null
          created_at?: string | null
          frascos?: number | null
          id?: string
          name: string
          ok?: boolean | null
          sachets?: number | null
          user_id?: string | null
        }
        Update: {
          cofres?: number | null
          created_at?: string | null
          frascos?: number | null
          id?: string
          name?: string
          ok?: boolean | null
          sachets?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_checkout_sessions: {
        Row: {
          buy_order: string
          completed_at: string | null
          created_at: string
          id: string
          payment_authorization_code: string | null
          plan_id: string
          provider: string
          session_id: string
          status: string
          total: number
          user_id: string
        }
        Insert: {
          buy_order: string
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_authorization_code?: string | null
          plan_id: string
          provider: string
          session_id: string
          status?: string
          total: number
          user_id: string
        }
        Update: {
          buy_order?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_authorization_code?: string | null
          plan_id?: string
          provider?: string
          session_id?: string
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_checkout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_checkout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_checkout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscription_checkout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_deliveries: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          period_number: number
          scheduled_for: string
          status: string
          subscription_id: string
          tracking_url: string | null
          venta_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json
          period_number: number
          scheduled_for: string
          status?: string
          subscription_id: string
          tracking_url?: string | null
          venta_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          period_number?: number
          scheduled_for?: string
          status?: string
          subscription_id?: string
          tracking_url?: string | null
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_deliveries_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_deliveries_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas_pendientes_logistica"
            referencedColumns: ["venta_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          frequency: string
          id: string
          included_items: Json | null
          key: string
          name: string
          price_clp: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          included_items?: Json | null
          key: string
          name: string
          price_clp: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          included_items?: Json | null
          key?: string
          name?: string
          price_clp?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json | null
          next_selection: Json | null
          pause_scheduled_until: string | null
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          next_selection?: Json | null
          pause_scheduled_until?: string | null
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          next_selection?: Json | null
          pause_scheduled_until?: string | null
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sumup_config: {
        Row: {
          api_key: string
          created_at: string
          empresa_id: string
          enabled: boolean
          environment: string
          id: string
          last_sync: string | null
          merchant_code: string
          sync_interval_minutes: number
          updated_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          empresa_id: string
          enabled?: boolean
          environment?: string
          id?: string
          last_sync?: string | null
          merchant_code: string
          sync_interval_minutes?: number
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          empresa_id?: string
          enabled?: boolean
          environment?: string
          id?: string
          last_sync?: string | null
          merchant_code?: string
          sync_interval_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sumup_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      sumup_payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          date: string
          empresa_id: string
          fee: number
          id: string
          reference: string | null
          status: string
          sumup_id: number
          transaction_code: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          date: string
          empresa_id: string
          fee?: number
          id?: string
          reference?: string | null
          status: string
          sumup_id: number
          transaction_code?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          empresa_id?: string
          fee?: number
          id?: string
          reference?: string | null
          status?: string
          sumup_id?: number
          transaction_code?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sumup_payouts_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      sumup_transacciones: {
        Row: {
          codigo_autorizacion: string | null
          conciliado: boolean
          created_at: string
          descripcion: string | null
          empresa_id: string
          estado: string
          fecha: string
          id: string
          moneda: string
          monto: number
          nombre_contraparte: string | null
          producto: string | null
          raw: Json
          rut_contraparte: string | null
          sumup_id: string
          tipo: string
          updated_at: string
          venta_id: string | null
        }
        Insert: {
          codigo_autorizacion?: string | null
          conciliado?: boolean
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          estado?: string
          fecha: string
          id?: string
          moneda?: string
          monto: number
          nombre_contraparte?: string | null
          producto?: string | null
          raw?: Json
          rut_contraparte?: string | null
          sumup_id: string
          tipo?: string
          updated_at?: string
          venta_id?: string | null
        }
        Update: {
          codigo_autorizacion?: string | null
          conciliado?: boolean
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          estado?: string
          fecha?: string
          id?: string
          moneda?: string
          monto?: number
          nombre_contraparte?: string | null
          producto?: string | null
          raw?: Json
          rut_contraparte?: string | null
          sumup_id?: string
          tipo?: string
          updated_at?: string
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sumup_transacciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      suscriptor_config: {
        Row: {
          active_since: string | null
          colmena_id: string | null
          next_billing: string | null
          plan: string | null
          user_id: string
        }
        Insert: {
          active_since?: string | null
          colmena_id?: string | null
          next_billing?: string | null
          plan?: string | null
          user_id: string
        }
        Update: {
          active_since?: string | null
          colmena_id?: string | null
          next_billing?: string | null
          plan?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscriptor_config_colmena_id_fkey"
            columns: ["colmena_id"]
            isOneToOne: false
            referencedRelation: "colmenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscriptor_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscriptor_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "suscriptor_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tasas_cambio_historial: {
        Row: {
          created_at: string
          fecha: string
          fuente: string
          id: string
          moneda: string
          valor: number
        }
        Insert: {
          created_at?: string
          fecha: string
          fuente?: string
          id?: string
          moneda: string
          valor: number
        }
        Update: {
          created_at?: string
          fecha?: string
          fuente?: string
          id?: string
          moneda?: string
          valor?: number
        }
        Relationships: []
      }
      terceros: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          empresa_id: string
          giro: string | null
          id: string
          nombre: string
          rut: string
          telefono: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          empresa_id: string
          giro?: string | null
          id?: string
          nombre: string
          rut: string
          telefono?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          empresa_id?: string
          giro?: string | null
          id?: string
          nombre?: string
          rut?: string
          telefono?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terceros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_fidelizacion: {
        Row: {
          canjeado: boolean | null
          cantidad: number | null
          cliente_id: string | null
          created_at: string | null
          evento_id: string | null
          id: string
          producto_id: string | null
          puntos_usados: number | null
        }
        Insert: {
          canjeado?: boolean | null
          cantidad?: number | null
          cliente_id?: string | null
          created_at?: string | null
          evento_id?: string | null
          id?: string
          producto_id?: string | null
          puntos_usados?: number | null
        }
        Update: {
          canjeado?: boolean | null
          cantidad?: number | null
          cliente_id?: string | null
          created_at?: string | null
          evento_id?: string | null
          id?: string
          producto_id?: string | null
          puntos_usados?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_fidelizacion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_fidelizacion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tickets_fidelizacion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tickets_fidelizacion_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_fidelizacion_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          activated_at: string | null
          id: string
          is_active: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      usuarios_empresas: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          rol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          rol: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      varroa_records: {
        Row: {
          colmena_id: string | null
          created_at: string | null
          date: string
          id: string
          level: number
          method: string | null
          user_id: string | null
        }
        Insert: {
          colmena_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          level: number
          method?: string | null
          user_id?: string | null
        }
        Update: {
          colmena_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          level?: number
          method?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "varroa_records_colmena_id_fkey"
            columns: ["colmena_id"]
            isOneToOne: false
            referencedRelation: "colmenas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          auth_code: string | null
          buy_order: string | null
          buyer_email: string | null
          buyer_mode: string | null
          cash_session_id: string | null
          channel: string | null
          claim_status: string | null
          claim_token: string | null
          claimed_at: string | null
          claimed_by: string | null
          cliente_id: string | null
          conciliado: boolean
          created_at: string | null
          direccion_envio: Json | null
          empresa_id: string | null
          estado: string | null
          fecha: string | null
          id: string
          is_guest: boolean
          is_new_client: boolean | null
          metodo_pago: string | null
          organizacion_id: string | null
          origen: string | null
          productos: Json
          rep_commission_base: number | null
          rep_commission_loyalty: number | null
          rep_commission_multiplier: number | null
          rep_commission_total: number | null
          sumup_checkout_id: string | null
          sumup_transaction_id: string | null
          total: number
          user_id: string | null
          vendedor_id: string | null
        }
        Insert: {
          auth_code?: string | null
          buy_order?: string | null
          buyer_email?: string | null
          buyer_mode?: string | null
          cash_session_id?: string | null
          channel?: string | null
          claim_status?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          cliente_id?: string | null
          conciliado?: boolean
          created_at?: string | null
          direccion_envio?: Json | null
          empresa_id?: string | null
          estado?: string | null
          fecha?: string | null
          id: string
          is_guest?: boolean
          is_new_client?: boolean | null
          metodo_pago?: string | null
          organizacion_id?: string | null
          origen?: string | null
          productos: Json
          rep_commission_base?: number | null
          rep_commission_loyalty?: number | null
          rep_commission_multiplier?: number | null
          rep_commission_total?: number | null
          sumup_checkout_id?: string | null
          sumup_transaction_id?: string | null
          total: number
          user_id?: string | null
          vendedor_id?: string | null
        }
        Update: {
          auth_code?: string | null
          buy_order?: string | null
          buyer_email?: string | null
          buyer_mode?: string | null
          cash_session_id?: string | null
          channel?: string | null
          claim_status?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          cliente_id?: string | null
          conciliado?: boolean
          created_at?: string | null
          direccion_envio?: Json | null
          empresa_id?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          is_guest?: boolean
          is_new_client?: boolean | null
          metodo_pago?: string | null
          organizacion_id?: string | null
          origen?: string | null
          productos?: Json
          rep_commission_base?: number | null
          rep_commission_loyalty?: number | null
          rep_commission_multiplier?: number | null
          rep_commission_total?: number | null
          sumup_checkout_id?: string | null
          sumup_transaction_id?: string | null
          total?: number
          user_id?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "rep_session_summary_view"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "ventas_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ventas_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      creador_balance_view: {
        Row: {
          balance_disponible: number | null
          codigo_ref: string | null
          comisiones_aprobadas: number | null
          comisiones_pendientes: number | null
          comisiones_total: number | null
          creador_id: string | null
          nombre_publico: string | null
          total_retirado: number | null
          total_usos_codigo: number | null
          user_id: string | null
        }
        Insert: {
          balance_disponible?: never
          codigo_ref?: string | null
          comisiones_aprobadas?: never
          comisiones_pendientes?: never
          comisiones_total?: never
          creador_id?: string | null
          nombre_publico?: string | null
          total_retirado?: never
          total_usos_codigo?: number | null
          user_id?: string | null
        }
        Update: {
          balance_disponible?: never
          codigo_ref?: string | null
          comisiones_aprobadas?: never
          comisiones_pendientes?: never
          comisiones_total?: never
          creador_id?: string | null
          nombre_publico?: string | null
          total_retirado?: never
          total_usos_codigo?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "creadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      creador_ranking_view: {
        Row: {
          codigo_ref: string | null
          estado: Database["public"]["Enums"]["creador_estado"] | null
          id: string | null
          nombre_publico: string | null
          plataforma: string | null
          ranking: number | null
          seguidores_aprox: number | null
          total_comisiones: number | null
          total_usos_codigo: number | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      recipe_costing_view: {
        Row: {
          activa: boolean | null
          costo_empaque: number | null
          costo_frasco: string | null
          costo_total: string | null
          formato: string | null
          margen_frasco: string | null
          margen_pct: string | null
          merma_pct: number | null
          precio_venta: number | null
          producto_id: string | null
          producto_nombre: string | null
          recipe_id: string | null
          rendimiento_frascos: number | null
          updated_at: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      rep_performance_view: {
        Row: {
          active: boolean | null
          balance_pendiente: number | null
          best_streak_days: number | null
          clients_captured: number | null
          commission_tier: string | null
          current_streak_days: number | null
          display_name: string | null
          email: string | null
          empresa_id: string | null
          full_name: string | null
          total_commissions_earned: number | null
          total_commissions_paid: number | null
          total_revenue_lifetime: number | null
          total_sales_lifetime: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rep_profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rep_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rep_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_ciclos_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rep_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_tier_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rep_session_summary_view: {
        Row: {
          cash_difference: number | null
          cash_revenue: number | null
          closed_at: string | null
          closing_cash_counted: number | null
          closing_cash_expected: number | null
          commission_tier: string | null
          digital_revenue: number | null
          display_name: string | null
          empresa_id: string | null
          opened_at: string | null
          opening_cash: number | null
          rep_id: string | null
          session_commissions: number | null
          session_id: string | null
          session_status: string | null
          total_revenue: number | null
          total_transactions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ciclos_balance: {
        Row: {
          saldo_actual: number | null
          user_id: string | null
        }
        Insert: {
          saldo_actual?: never
          user_id?: string | null
        }
        Update: {
          saldo_actual?: never
          user_id?: string | null
        }
        Relationships: []
      }
      user_tier_view: {
        Row: {
          ciclos_historicos: number | null
          tier: string | null
          user_id: string | null
        }
        Relationships: []
      }
      ventas_pendientes_logistica: {
        Row: {
          buyer_mode: string | null
          cliente_nombre: string | null
          created_at: string | null
          is_guest: boolean | null
          items: Json | null
          metodo_pago: string | null
          origen: string | null
          pendiente_envio: boolean | null
          total: number | null
          venta_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      actualizar_streak_rep: { Args: { p_rep_id: string }; Returns: undefined }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      agregar_puntos_usuario: {
        Args: {
          p_empresa_id: string
          p_metadata?: Json
          p_motivo?: string
          p_puntos: number
          p_user_id: string
          p_venta_id?: string
        }
        Returns: string
      }
      aplicar_codigo_creador:
        | {
            Args: {
              p_cliente_id: string
              p_codigo: string
              p_monto_venta: number
              p_venta_id: string
            }
            Returns: {
              comision: number
              creador_nombre: string
              descuento: number
              valido: boolean
            }[]
          }
        | {
            Args: {
              p_cliente_id: string
              p_codigo: string
              p_monto_venta: number
              p_venta_id: string
            }
            Returns: {
              comision: number
              creador_nombre: string
              descuento: number
              valido: boolean
            }[]
          }
      aplicar_reglas_conciliacion: {
        Args: { p_empresa_id: string }
        Returns: {
          confianza: number
          entidad_id: string
          movimiento_id: string
          propuesta_id: string
          tipo_entidad: string
        }[]
      }
      buscar_factura_por_regla: {
        Args: {
          mov: Database["public"]["Tables"]["banco_chile_movimientos"]["Row"]
          reg: Database["public"]["Tables"]["reconciliation_rules"]["Row"]
        }
        Returns: {
          confianza: number
          factura_id: string
        }[]
      }
      buscar_gasto_por_regla: {
        Args: {
          mov: Database["public"]["Tables"]["banco_chile_movimientos"]["Row"]
          reg: Database["public"]["Tables"]["reconciliation_rules"]["Row"]
        }
        Returns: {
          confianza: number
          gasto_id: string
        }[]
      }
      calcular_comision_venta: {
        Args: { p_empresa_id: string; p_venta_id: string }
        Returns: {
          base_commission: number
          loyalty_bonus: number
          streak_bonus: number
          tier_multiplier: number
          total_commission: number
          volume_multiplier: number
        }[]
      }
      calcular_costo_receta: { Args: { p_recipe_id: string }; Returns: Json }
      calcular_descuento: {
        Args: { p_descuento_id: string; p_monto_original: number }
        Returns: number
      }
      calcular_irr_lote: { Args: { p_lote_id: string }; Returns: number }
      calcular_metricas_creadores_mes: {
        Args: { p_mes: string }
        Returns: undefined
      }
      calcular_puntos_compra: {
        Args: {
          p_empresa_id: string
          p_monto_compra: number
          p_user_id: string
        }
        Returns: number
      }
      canjear_codigo_invitacion: {
        Args: { p_code: string; p_user_id: string }
        Returns: {
          empresa_id_result: string
          exito: boolean
          herramientas: Json
          roles_asignados: string[]
        }[]
      }
      canjear_recompensa: {
        Args: {
          p_empresa_id: string
          p_recompensa_id: string
          p_user_id: string
        }
        Returns: Json
      }
      complete_referral_signup: {
        Args: { p_new_user_id: string; p_referrer_id: string }
        Returns: Json
      }
      crear_qr_producto: {
        Args: {
          p_apiario_id: string
          p_cantidad?: number
          p_cosecha_id: string
          p_empresa_id: string
          p_fecha_produccion: string
          p_fecha_vencimiento?: string
          p_lote_id: string
          p_producto_id: string
        }
        Returns: {
          codigo: string
          qr_id: string
        }[]
      }
      crear_tarea_crm: {
        Args: {
          p_descripcion?: string
          p_empresa_id: string
          p_fecha_vencimiento: string
          p_hora?: string
          p_lead_id?: string
          p_prioridad?: string
          p_tipo?: string
          p_titulo: string
          p_vendedor_id: string
        }
        Returns: string
      }
      current_role: { Args: never; Returns: string }
      decrement_stock: {
        Args: { p_id: string; p_qty: number }
        Returns: {
          id: string
          kg_restante_lote: number
          lote_id: string
          stock: number
        }[]
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      es_descuento_aplicable: {
        Args: {
          p_canal: string
          p_categoria: string
          p_cliente_id: string
          p_descuento_id: string
          p_monto_compra: number
          p_producto_id: string
        }
        Returns: boolean
      }
      evaluar_tier_rep: { Args: { p_rep_id: string }; Returns: string }
      expire_checkout_sessions: { Args: never; Returns: undefined }
      generar_codigo_creador: { Args: { nombre: string }; Returns: string }
      generar_codigo_invitacion: {
        Args: { p_empresa_id: string }
        Returns: string
      }
      generar_codigo_qr: { Args: never; Returns: string }
      generar_event_hash: {
        Args: {
          p_created_at: string
          p_evento: string
          p_metadata: Json
          p_qr_id: string
        }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_ecosystem_metrics: { Args: never; Returns: Json }
      gettransactionid: { Args: never; Returns: unknown }
      has_empresa_access: {
        Args: { target_empresa_id: string }
        Returns: boolean
      }
      incrementar_usos_descuento: {
        Args: { p_descuento_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_gerente: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mover_lead_pipeline: {
        Args: {
          p_lead_id: string
          p_nueva_etapa: string
          p_vendedor_id?: string
        }
        Returns: Json
      }
      obtener_historial_qr: {
        Args: { p_qr_id: string }
        Returns: {
          created_at: string
          event_hash: string
          evento: string
          latitud: number
          longitud: number
          metadata: Json
          ubicacion: string
          usuario_id: string
        }[]
      }
      obtener_metricas_pipeline: {
        Args: { p_empresa_id: string }
        Returns: {
          cantidad_leads: number
          etapa: string
          probabilidad_promedio: number
          valor_promedio: number
          valor_total: number
        }[]
      }
      obtener_tareas_vencidas: {
        Args: { p_empresa_id: string; p_vendedor_id?: string }
        Returns: {
          fecha_vencimiento: string
          id: string
          lead_id: string
          prioridad: string
          titulo: string
          vendedor_id: string
        }[]
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      redeem_loyalty_reward: {
        Args: {
          p_idempotency_key: string
          p_reward_id: string
          p_user_id: string
        }
        Returns: Json
      }
      registrar_escaneo_qr: {
        Args: {
          p_codigo: string
          p_evento: string
          p_latitud?: number
          p_longitud?: number
          p_metadata?: Json
          p_ubicacion?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      registrar_interaccion_crm: {
        Args: {
          p_asunto?: string
          p_descripcion?: string
          p_duracion_minutos?: number
          p_empresa_id: string
          p_fecha_hora?: string
          p_lead_id: string
          p_metadata?: Json
          p_proximo_seguimiento?: string
          p_resultado?: string
          p_tipo: string
          p_vendedor_id: string
        }
        Returns: string
      }
      resolve_payment_failure: {
        Args: { p_failure_id: string }
        Returns: undefined
      }
      schedule_payment_retry: {
        Args: { p_failure_id: string }
        Returns: undefined
      }
      sii_caf_next_folio: {
        Args: { p_empresa_id: string; p_tipo_dte: number }
        Returns: {
          caf_id: string
          fch_resol: string
          folio: number
          folio_hasta: number
          nro_resol: number
        }[]
      }
      solicitar_retiro_creador: {
        Args: {
          p_datos_pago: Json
          p_metodo_pago: string
          p_monto: number
          p_user_id: string
        }
        Returns: {
          estado: string
          id: string
          monto_solicitado: number
        }[]
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      tier_progress_rep: { Args: { p_rep_id: string }; Returns: Json }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      verificar_integridad_audit_trail: {
        Args: { p_qr_id: string }
        Returns: {
          created_at: string
          es_valido: boolean
          evento: string
          hash_almacenado: string
          hash_calculado: string
          id: string
        }[]
      }
      weekly_leaderboard: {
        Args: { p_empresa_id: string }
        Returns: {
          commission_tier: string
          display_name: string
          rank: number
          rep_id: string
          total_commissions: number
          total_revenue: number
          total_sales: number
        }[]
      }
    }
    Enums: {
      accion_tipo:
        | "compra"
        | "registro_lote"
        | "resena_sensorial"
        | "reserva_cosecha"
        | "referido"
        | "conversion_territorial"
        | "canje"
      comision_estado: "pendiente" | "aprobada" | "pagada" | "rechazada"
      creador_estado: "pendiente" | "activo" | "suspendido" | "inactivo"
      perfil_estado: "pendiente" | "activo" | "suspendido"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      accion_tipo: [
        "compra",
        "registro_lote",
        "resena_sensorial",
        "reserva_cosecha",
        "referido",
        "conversion_territorial",
        "canje",
      ],
      comision_estado: ["pendiente", "aprobada", "pagada", "rechazada"],
      creador_estado: ["pendiente", "activo", "suspendido", "inactivo"],
      perfil_estado: ["pendiente", "activo", "suspendido"],
    },
  },
} as const
