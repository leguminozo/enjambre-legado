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
          id: string
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
      empresas: {
        Row: {
          ciudad: string | null
          comuna: string | null
          created_at: string
          direccion: string | null
          email: string | null
          giro: string | null
          id: string
          razon_social: string
          region: string | null
          rut: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          ciudad?: string | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          giro?: string | null
          id?: string
          razon_social: string
          region?: string | null
          rut: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          ciudad?: string | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          giro?: string | null
          id?: string
          razon_social?: string
          region?: string | null
          rut?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      facturas_emitidas: {
        Row: {
          created_at: string
          descripcion: string | null
          empresa_id: string
          estado: string
          estado_sii: string | null
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          idempotency_key: string | null
          monto_exento: number
          monto_iva: number
          monto_iva_usado: number
          monto_neto: number
          monto_total: number
          numero: string | null
          periodo_id: string | null
          tercero_id: string | null
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          estado?: string
          estado_sii?: string | null
          fecha_emision: string
          fecha_vencimiento?: string | null
          id?: string
          idempotency_key?: string | null
          monto_exento?: number
          monto_iva: number
          monto_iva_usado?: number
          monto_neto: number
          monto_total: number
          numero?: string | null
          periodo_id?: string | null
          tercero_id?: string | null
          tipo_documento?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          estado?: string
          estado_sii?: string | null
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          idempotency_key?: string | null
          monto_exento?: number
          monto_iva?: number
          monto_iva_usado?: number
          monto_neto?: number
          monto_total?: number
          numero?: string | null
          periodo_id?: string | null
          tercero_id?: string | null
          tipo_documento?: string
          updated_at?: string
        }
        Relationships: [
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
      logistica_envios: {
        Row: {
          created_at: string | null
          destino: string
          eta: string | null
          id: string
          items: string
          status: string
          tracking_code: string
          user_id: string | null
          via: string | null
        }
        Insert: {
          created_at?: string | null
          destino: string
          eta?: string | null
          id?: string
          items: string
          status: string
          tracking_code: string
          user_id?: string | null
          via?: string | null
        }
        Update: {
          created_at?: string | null
          destino?: string
          eta?: string | null
          id?: string
          items?: string
          status?: string
          tracking_code?: string
          user_id?: string | null
          via?: string | null
        }
        Relationships: []
      }
      lotes: {
        Row: {
          arboles_asociados: number | null
          blockchain_hash: string | null
          cosecha_ids: string[] | null
          created_at: string | null
          estado: string | null
          id: string
          kg_total: number | null
        }
        Insert: {
          arboles_asociados?: number | null
          blockchain_hash?: string | null
          cosecha_ids?: string[] | null
          created_at?: string | null
          estado?: string | null
          id?: string
          kg_total?: number | null
        }
        Update: {
          arboles_asociados?: number | null
          blockchain_hash?: string | null
          cosecha_ids?: string[] | null
          created_at?: string | null
          estado?: string | null
          id?: string
          kg_total?: number | null
        }
        Relationships: []
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
      productos: {
        Row: {
          created_at: string | null
          descripcion_regenerativa: string | null
          formato: string | null
          fotos: string[] | null
          id: string
          lote_id: string | null
          nombre: string | null
          precio: number | null
          slug: string | null
          stock: number | null
          video_url: string | null
          visible: boolean | null
        }
        Insert: {
          created_at?: string | null
          descripcion_regenerativa?: string | null
          formato?: string | null
          fotos?: string[] | null
          id?: string
          lote_id?: string | null
          nombre?: string | null
          precio?: number | null
          slug?: string | null
          stock?: number | null
          video_url?: string | null
          visible?: boolean | null
        }
        Update: {
          created_at?: string | null
          descripcion_regenerativa?: string | null
          formato?: string | null
          fotos?: string[] | null
          id?: string
          lote_id?: string | null
          nombre?: string | null
          precio?: number | null
          slug?: string | null
          stock?: number | null
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
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        ]
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
          cliente_id: string | null
          conciliado: boolean
          created_at: string | null
          empresa_id: string | null
          estado: string | null
          fecha: string | null
          id: string
          metodo_pago: string | null
          productos: Json
          total: number
          user_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          conciliado?: boolean
          created_at?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha?: string | null
          id: string
          metodo_pago?: string | null
          productos: Json
          total: number
          user_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          conciliado?: boolean
          created_at?: string | null
          empresa_id?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          metodo_pago?: string | null
          productos?: Json
          total?: number
          user_id?: string | null
        }
        Relationships: [
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
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      accion_tipo:
        | "compra"
        | "registro_lote"
        | "resena_sensorial"
        | "reserva_cosecha"
        | "referido"
        | "conversion_territorial"
      perfil_estado: "pendiente" | "activo" | "suspendido"
    }
    CompositeTypes: {
      [_ in never]: never
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
      ],
      perfil_estado: ["pendiente", "activo", "suspendido"],
    },
  },
} as const
